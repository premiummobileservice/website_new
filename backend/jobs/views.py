"""Jobs views – matching fixurdevice workshop & invoice workflows."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from decimal import Decimal
import random
from django.db import models

from .models import RepairJob, QuoteLine
from .serializers import RepairJobSerializer, RepairJobListSerializer
from accounts.permissions import IsTelecallerOrAbove


class RepairJobViewSet(viewsets.ModelViewSet):
    filterset_fields = ["status", "payment_status", "technician"]
    search_fields = ["job_id", "device_description", "imei_serial", "lead__name", "lead__phone", "invoice_number"]
    ordering_fields = ["created_at", "status", "completed_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = RepairJob.objects.select_related("technician", "lead", "customer")

        # Stage filtering (ongoing vs completed vs all)
        stage = self.request.query_params.get("stage")
        if stage == "ongoing":
            qs = qs.exclude(status__in=[
                RepairJob.Status.COMPLETED,
                RepairJob.Status.DELIVERED,
                RepairJob.Status.CANCELLED,
            ])
        elif stage == "completed":
            qs = qs.filter(status__in=[
                RepairJob.Status.COMPLETED,
                RepairJob.Status.DELIVERED,
            ])

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return RepairJobListSerializer
        return RepairJobSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        # Sanitize numeric fields: empty strings or NaN -> 0
        for num_field in ["vendor_cost", "product_price", "service_charges", "total_customer_charge", "internal_profit", "quote_total"]:
            if num_field in data:
                val = data[num_field]
                if val == "" or val is None or str(val).lower() in ("nan", "null"):
                    data[num_field] = 0
        if "technician" in data and (data["technician"] == "" or data["technician"] == 0 or data["technician"] == "0"):
            data["technician"] = None
        request._full_data = data
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete_job(self, request, pk=None):
        """1-Click mark job done/delivered matching fixurdevice workflow."""
        job = self.get_object()
        data = request.data

        work_done = data.get("work_performed") or data.get("work_notes") or ""
        if work_done:
            job.work_performed = work_done

        tech_id = data.get("technician")
        if tech_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                job.technician = User.objects.get(pk=tech_id)
            except User.DoesNotExist:
                pass
        elif not job.technician and request.user.is_authenticated:
            job.technician = request.user

        job.status = RepairJob.Status.COMPLETED
        job.completed_at = timezone.now()

        if data.get("payment_done", True):
            job.payment_status = RepairJob.PaymentStatus.PAID
            job.payment_received_at = timezone.now()

        # Generate invoice if requested and missing
        if data.get("generate_invoice", True) and not job.invoice_number:
            date_part = timezone.now().strftime("%y%m%d")
            job.invoice_number = f"INV-{date_part}-{job.pk:04d}"

        job.save()

        # Link and complete associated lead
        if job.lead:
            from leads.models import Lead, Activity
            job.lead.status = Lead.Status.COMPLETED
            job.lead.save()
            Activity.objects.create(
                lead=job.lead,
                user=request.user if request.user.is_authenticated else None,
                activity_type=Activity.ActivityType.STATUS_CHANGE,
                text=f"Repair Job {job.job_id} completed. Invoice {job.invoice_number or 'N/A'} generated.",
            )

        return Response(RepairJobSerializer(job).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="create-invoice")
    def create_invoice(self, request, pk=None):
        """Create or regenerate invoice for a repair booking."""
        job = self.get_object()
        data = request.data

        date_part = timezone.now().strftime("%y%m%d")
        if not job.invoice_number:
            job.invoice_number = f"INV-{date_part}-{job.pk:04d}"

        if data.get("status") == "paid":
            job.payment_status = RepairJob.PaymentStatus.PAID
            job.payment_received_at = timezone.now()

        job.save()
        return Response(RepairJobSerializer(job).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="invoices")
    def list_invoices(self, request):
        """Return all repair bookings that have invoice generated or are completed."""
        qs = RepairJob.objects.select_related("lead", "technician").exclude(invoice_number="").order_by("-updated_at")
        serializer = RepairJobSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def handle_exception(self, exc):
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"RepairJobViewSet exception: {exc}")
        return super().handle_exception(exc)

