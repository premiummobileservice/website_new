"""
Leads views – public submission and CRM management.
"""
import logging
import csv
from io import StringIO

from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from .models import Lead, Activity, Note, FollowUp
from .serializers import (
    PublicLeadSerializer,
    LeadListSerializer,
    LeadDetailSerializer,
    LeadCreateManualSerializer,
    NoteSerializer,
    FollowUpSerializer,
    ActivitySerializer,
    BulkStatusUpdateSerializer,
    BulkAssignSerializer,
)
from accounts.permissions import IsTelecallerOrAbove, IsManagerOrAbove
from notifications.tasks import send_lead_notification_emails

logger = logging.getLogger(__name__)
User = get_user_model()


class LeadSubmitThrottle(AnonRateThrottle):
    """5 lead submissions per minute per IP."""
    rate = "5/min"
    scope = "lead_submit"


class PublicLeadCreateView(generics.CreateAPIView):
    """
    POST /api/public/leads/
    Public endpoint – no authentication required.
    Validates, deduplicates, saves, queues emails, returns reference code.
    """
    serializer_class = PublicLeadSerializer
    permission_classes = [AllowAny]
    throttle_classes = [LeadSubmitThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        # Silently drop honeypot-triggered submissions
        if validated_data.get("honeypot_triggered"):
            logger.warning(f"Honeypot triggered from IP: {self._get_ip()}")
            # Return success to avoid alerting bots
            return Response(
                {"reference": "PMR-000000", "message": "Thank you! We will be in touch shortly."},
                status=status.HTTP_201_CREATED,
            )

        # Deduplication: same phone + repair within 10 minutes
        ten_minutes_ago = timezone.now() - timedelta(minutes=10)
        phone = validated_data.get("phone", "")
        existing = Lead.objects.filter(
            phone=phone,
            created_at__gte=ten_minutes_ago,
        ).first()

        if existing:
            logger.info(f"Duplicate lead detected for phone {phone}, returning existing ref {existing.reference}")
            return Response(
                {
                    "reference": existing.reference,
                    "message": "Thank you! We already received your enquiry and will be in touch shortly.",
                },
                status=status.HTTP_200_OK,
            )

        # Save lead
        with transaction.atomic():
            lead = Lead.objects.create(**validated_data)
            Activity.objects.create(
                lead=lead,
                activity_type=Activity.ActivityType.STATUS_CHANGE,
                text=f"Lead created via website. Status: New.",
            )

        logger.info(f"New lead created: {lead.reference} from {self._get_ip()}")

        # Queue emails (failure must NOT fail the request)
        try:
            send_lead_notification_emails.apply_async(
                args=[lead.pk],
            )
        except Exception as e:
            logger.warning(f"Failed to queue email task for lead {lead.reference}: {e}. Trying direct dispatch.")
            try:
                send_lead_notification_emails.apply(args=[lead.pk])
            except Exception as exc:
                logger.error(f"Direct email dispatch also failed for lead {lead.reference}: {exc}")

        return Response(
            {
                "reference": lead.reference,
                "message": "Thank you! We've received your repair enquiry and will contact you shortly. "
                           "No repairs are carried out without your approval.",
            },
            status=status.HTTP_201_CREATED,
        )

    def _get_ip(self):
        xff = self.request.META.get("HTTP_X_FORWARDED_FOR")
        return xff.split(",")[0].strip() if xff else self.request.META.get("REMOTE_ADDR", "")


# ── CRM Lead ViewSet ───────────────────────────────────────────────────────────

class LeadFilter:
    """Simple filter helper."""
    pass


class LeadViewSet(viewsets.ModelViewSet):
    """
    CRM lead management – full CRUD + bulk actions + CSV export.
    Telecaller+: read + note + follow-up.
    Manager+: assign, status, bulk.
    Admin: delete.
    """
    permission_classes = [IsTelecallerOrAbove]
    filterset_fields = ["status", "source", "device_type", "area", "assigned_to"]
    search_fields = ["name", "phone", "email", "brand_model", "reference", "area"]
    ordering_fields = ["created_at", "updated_at", "status", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = Lead.objects.select_related("assigned_to")
        # Technicians don't see leads (only jobs)
        if getattr(user, "role", "") == "technician":
            return Lead.objects.none()

        # Archive filter
        show_archived = self.request.query_params.get("archived") == "true"
        if show_archived:
            qs = qs.filter(is_archived=True)
        else:
            qs = qs.filter(is_archived=False)

        # Status filter
        status_param = self.request.query_params.get("status")
        if status_param and status_param != "all":
            if status_param == "rejected":
                qs = qs.filter(status__in=[Lead.Status.NOT_INTERESTED, Lead.Status.WRONG_NUMBER])
            elif status_param in ["not_interested", Lead.Status.NOT_INTERESTED]:
                qs = qs.filter(status=Lead.Status.NOT_INTERESTED)
            elif status_param in ["wrong_number", Lead.Status.WRONG_NUMBER]:
                qs = qs.filter(status=Lead.Status.WRONG_NUMBER)
            else:
                qs = qs.filter(status=status_param)

        # Callback filters
        callback_filter = self.request.query_params.get("callback_filter")
        today = timezone.now().date()
        if callback_filter == "due_today":
            qs = qs.filter(status=Lead.Status.CALLBACK_LATER, callback_date=today)
        elif callback_filter == "overdue":
            qs = qs.filter(status=Lead.Status.CALLBACK_LATER, callback_date__lt=today)
        elif callback_filter == "upcoming":
            qs = qs.filter(status=Lead.Status.CALLBACK_LATER, callback_date__gt=today)

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return LeadListSerializer
        if self.action == "create":
            return LeadCreateManualSerializer
        return LeadDetailSerializer

    def perform_create(self, serializer):
        lead = serializer.save()
        Activity.objects.create(
            lead=lead,
            user=self.request.user,
            activity_type=Activity.ActivityType.OTHER,
            text=f"Lead manually created by {self.request.user.get_full_name() or self.request.user.username}.",
        )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_status = old_instance.status
        old_assigned = old_instance.assigned_to_id

        instance = serializer.save()

        # Auto-log status change
        if instance.status != old_status:
            Activity.objects.create(
                lead=instance,
                user=self.request.user,
                activity_type=Activity.ActivityType.STATUS_CHANGE,
                text=f"Status changed from '{old_status}' to '{instance.status}'.",
            )

        # Auto-log assignment change
        if instance.assigned_to_id != old_assigned:
            assignee_name = (
                instance.assigned_to.get_full_name() if instance.assigned_to else "Unassigned"
            )
            Activity.objects.create(
                lead=instance,
                user=self.request.user,
                activity_type=Activity.ActivityType.ASSIGNED,
                text=f"Lead assigned to {assignee_name}.",
            )

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "admin":
            return Response(
                {"detail": "Only admins can delete leads."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    # ── Nested actions ─────────────────────────────────────────────────────────

    @action(detail=True, methods=["get", "post"], url_path="notes")
    def notes(self, request, pk=None):
        lead = self.get_object()
        if request.method == "GET":
            notes = Note.objects.filter(lead=lead)
            return Response(NoteSerializer(notes, many=True).data)
        serializer = NoteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        note = serializer.save(lead=lead)
        Activity.objects.create(
            lead=lead,
            user=request.user,
            activity_type=Activity.ActivityType.NOTE_ADDED,
            text=f"Note added: {note.text[:100]}{'...' if len(note.text) > 100 else ''}",
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="follow-ups")
    def follow_ups(self, request, pk=None):
        lead = self.get_object()
        if request.method == "GET":
            fus = FollowUp.objects.filter(lead=lead)
            return Response(FollowUpSerializer(fus, many=True).data)
        serializer = FollowUpSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        fu = serializer.save(lead=lead)
        Activity.objects.create(
            lead=lead,
            user=request.user,
            activity_type=Activity.ActivityType.FOLLOW_UP,
            text=f"Follow-up scheduled for {fu.due_at.strftime('%d %b %Y %H:%M')}.",
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="activities")
    def activities(self, request, pk=None):
        lead = self.get_object()
        acts = Activity.objects.filter(lead=lead)
        return Response(ActivitySerializer(acts, many=True).data)

    @action(detail=True, methods=["post"], url_path="action")
    def lead_action(self, request, pk=None):
        """
        4-Action CRM Pipeline Endpoint (matching fixurdevice):
        1. interested -> Sets status=interested, creates/links RepairJob with technician & pricing.
        2. callback_later -> Sets status=callback_later, callback_date, callback_time, callback_notes.
        3. not_interested -> Sets status=not_interested, rejection_reason, rejection_notes.
        4. wrong_number -> Sets status=wrong_number, rejection_reason='Wrong Number'.
        """
        lead = self.get_object()
        data = request.data
        action_name = data.get("action", "").lower()
        from jobs.models import RepairJob
        from decimal import Decimal

        if action_name in ["interested", "booking"]:
            lead.status = Lead.Status.INTERESTED
            technician_id = data.get("technician") or data.get("assigned_technician")
            product_price = Decimal(str(data.get("product_price", 0) or 0))
            vendor_cost = Decimal(str(data.get("vendor_cost", 0) or 0))
            vendor_name = data.get("vendor_name", "")
            part_name = data.get("part_name", "")
            service_charges = Decimal(str(data.get("service_charges", 0) or 0))
            total_charge = Decimal(str(data.get("total_customer_charge", 0) or (product_price + service_charges)))
            internal_profit = Decimal(str(data.get("internal_profit", 0) or (total_charge - vendor_cost)))

            lead.product_price = product_price
            lead.vendor_cost = vendor_cost
            lead.vendor_name = vendor_name
            lead.service_charges = service_charges
            lead.total_customer_charge = total_charge
            lead.internal_profit = internal_profit

            # Create or update RepairJob
            job, created = RepairJob.objects.get_or_create(
                lead=lead,
                defaults={
                    "device_description": f"{lead.brand_model} – {lead.repair_needed}",
                    "status": RepairJob.Status.SCHEDULED,
                    "pickup_address": lead.area,
                    "diagnosis_notes": data.get("notes", "") or data.get("diagnosis", ""),
                    "part_name": part_name,
                    "vendor_name": vendor_name,
                    "vendor_cost": vendor_cost,
                    "product_price": product_price,
                    "service_charges": service_charges,
                    "total_customer_charge": total_charge,
                    "internal_profit": internal_profit,
                }
            )
            if not created:
                job.part_name = part_name or job.part_name
                job.vendor_name = vendor_name or job.vendor_name
                job.vendor_cost = vendor_cost or job.vendor_cost
                job.product_price = product_price or job.product_price
                job.service_charges = service_charges or job.service_charges
                job.total_customer_charge = total_charge or job.total_customer_charge
                job.internal_profit = internal_profit or job.internal_profit
                if data.get("notes"):
                    job.diagnosis_notes = data.get("notes")

            if technician_id:
                try:
                    job.technician = User.objects.get(pk=technician_id)
                except User.DoesNotExist:
                    pass
            job.save()
            lead.save()

            Activity.objects.create(
                lead=lead,
                user=request.user,
                activity_type=Activity.ActivityType.JOB_CREATED,
                text=f"Action: Interested. Linked to Repair Job {job.job_id}.",
            )
            return Response(LeadDetailSerializer(lead).data, status=status.HTTP_200_OK)

        elif action_name in ["callback_later", "callback"]:
            lead.status = Lead.Status.CALLBACK_LATER
            lead.callback_date = data.get("callback_date") or None
            lead.callback_time = data.get("callback_time", "")
            lead.callback_notes = data.get("callback_notes", "") or data.get("notes", "")
            lead.save()

            Activity.objects.create(
                lead=lead,
                user=request.user,
                activity_type=Activity.ActivityType.FOLLOW_UP,
                text=f"Action: Call Back Later on {lead.callback_date} at {lead.callback_time}. Note: {lead.callback_notes}",
            )
            return Response(LeadDetailSerializer(lead).data, status=status.HTTP_200_OK)

        elif action_name in ["not_interested", "rejected"]:
            lead.status = Lead.Status.NOT_INTERESTED
            lead.rejection_reason = data.get("rejection_reason", "Customer not interested")
            lead.rejection_notes = data.get("rejection_notes", "") or data.get("notes", "")
            lead.save()

            Activity.objects.create(
                lead=lead,
                user=request.user,
                activity_type=Activity.ActivityType.STATUS_CHANGE,
                text=f"Action: Not Interested ({lead.rejection_reason}). Note: {lead.rejection_notes}",
            )
            return Response(LeadDetailSerializer(lead).data, status=status.HTTP_200_OK)

        elif action_name in ["wrong_number"]:
            lead.status = Lead.Status.WRONG_NUMBER
            lead.rejection_reason = "Wrong Number"
            lead.rejection_notes = data.get("notes", "") or data.get("rejection_notes", "Verified as wrong number")
            lead.save()

            Activity.objects.create(
                lead=lead,
                user=request.user,
                activity_type=Activity.ActivityType.STATUS_CHANGE,
                text=f"Action: Wrong Number. Note: {lead.rejection_notes}",
            )
            return Response(LeadDetailSerializer(lead).data, status=status.HTTP_200_OK)

        elif action_name in ["reopen", "restore"]:
            lead.status = Lead.Status.NEW
            lead.save()
            Activity.objects.create(
                lead=lead,
                user=request.user,
                activity_type=Activity.ActivityType.STATUS_CHANGE,
                text="Enquiry restored to New status.",
            )
            return Response(LeadDetailSerializer(lead).data, status=status.HTTP_200_OK)

        return Response({"error": "Unknown action"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="archive")
    def archive_lead(self, request, pk=None):
        """Soft archive, restore, or permanent delete an enquiry matching fixurdevice."""
        try:
            lead = Lead.objects.get(pk=pk)
        except Lead.DoesNotExist:
            return Response({"error": "Lead not found"}, status=status.HTTP_404_NOT_FOUND)

        action_type = request.data.get("action", "")
        permanent = request.data.get("permanent", False) or action_type == "delete"

        if permanent:
            lead_ref = lead.reference
            lead.delete()
            return Response({"detail": f"Lead {lead_ref} deleted permanently.", "deleted": True})
        elif action_type in ["unarchive", "restore"]:
            lead.is_archived = False
            lead.save()
            Activity.objects.create(
                lead=lead,
                user=request.user if request.user.is_authenticated else None,
                activity_type=Activity.ActivityType.STATUS_CHANGE,
                text="Lead unarchived and restored to active pipeline.",
            )
            return Response({"detail": f"Lead {lead.reference} unarchived.", "archived": False})
        else:
            lead.is_archived = True
            lead.save()
            Activity.objects.create(
                lead=lead,
                user=request.user if request.user.is_authenticated else None,
                activity_type=Activity.ActivityType.STATUS_CHANGE,
                text="Lead archived.",
            )
            return Response({"detail": f"Lead {lead.reference} archived safely.", "archived": True})

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """Aggregate stats for CRM Dashboard matching fixurdevice."""
        from django.db.models import Sum
        from jobs.models import RepairJob
        today = timezone.now().date()

        enquiries_total = Lead.objects.count()
        enquiries_today = Lead.objects.filter(created_at__date=today).count()
        enquiries_new = Lead.objects.filter(status=Lead.Status.NEW).count()
        enquiries_interested = Lead.objects.filter(status=Lead.Status.INTERESTED).count()

        callbacks_due_today = Lead.objects.filter(status=Lead.Status.CALLBACK_LATER, callback_date=today).count()
        callbacks_overdue = Lead.objects.filter(status=Lead.Status.CALLBACK_LATER, callback_date__lt=today).count()
        callbacks_upcoming = Lead.objects.filter(status=Lead.Status.CALLBACK_LATER, callback_date__gt=today).count()
        callbacks_total = Lead.objects.filter(status=Lead.Status.CALLBACK_LATER).count()

        rejected_not_interested = Lead.objects.filter(status=Lead.Status.NOT_INTERESTED).count()
        rejected_wrong_number = Lead.objects.filter(status=Lead.Status.WRONG_NUMBER).count()
        rejected_total = rejected_not_interested + rejected_wrong_number

        jobs_active = RepairJob.objects.exclude(status__in=[RepairJob.Status.COMPLETED, RepairJob.Status.DELIVERED, RepairJob.Status.CANCELLED]).count()
        jobs_completed = RepairJob.objects.filter(status__in=[RepairJob.Status.COMPLETED, RepairJob.Status.DELIVERED]).count()
        jobs_rework = RepairJob.objects.filter(status=RepairJob.Status.REWORK).count()
        jobs_total = RepairJob.objects.count()

        rev_aggr = RepairJob.objects.filter(status__in=[RepairJob.Status.COMPLETED, RepairJob.Status.DELIVERED]).aggregate(
            total=Sum("total_customer_charge")
        )
        total_rev = float(rev_aggr.get("total") or 0)

        pending_rev_aggr = RepairJob.objects.exclude(status__in=[RepairJob.Status.COMPLETED, RepairJob.Status.DELIVERED, RepairJob.Status.CANCELLED]).aggregate(
            total=Sum("total_customer_charge")
        )
        pending_rev = float(pending_rev_aggr.get("total") or 0)

        return Response({
            "enquiries": {
                "total": enquiries_total,
                "new_today": enquiries_today,
                "new_pending": enquiries_new,
                "interested": enquiries_interested,
            },
            "callbacks": {
                "due_today": callbacks_due_today,
                "overdue": callbacks_overdue,
                "upcoming": callbacks_upcoming,
                "total": callbacks_total,
            },
            "rejected": {
                "not_interested": rejected_not_interested,
                "wrong_number": rejected_wrong_number,
                "total": rejected_total,
            },
            "bookings": {
                "active": jobs_active,
                "completed": jobs_completed,
                "rework": jobs_rework,
                "total": jobs_total,
            },
            "invoices": {
                "count": jobs_completed,
                "total_revenue": total_rev,
                "pending_revenue": pending_rev,
            }
        })

    @action(detail=True, methods=["post"], url_path="convert-to-job",
            permission_classes=[IsManagerOrAbove])
    def convert_to_job(self, request, pk=None):
        lead = self.get_object()
        from jobs.models import RepairJob

        if hasattr(lead, "repair_job"):
            return Response(
                {"detail": "A repair job already exists for this lead.",
                 "job_id": lead.repair_job.pk, "job_ref": lead.repair_job.job_id},
                status=status.HTTP_200_OK,
            )
        job = RepairJob.objects.create(
            lead=lead,
            device_description=f"{lead.brand_model} – {lead.repair_needed}",
            status=RepairJob.Status.SCHEDULED,
            pickup_address=lead.area,
        )
        lead.status = Lead.Status.INTERESTED
        lead.save()
        Activity.objects.create(
            lead=lead,
            user=request.user,
            activity_type=Activity.ActivityType.JOB_CREATED,
            text=f"Repair job {job.job_id} created.",
        )
        return Response({"job_id": job.pk, "job_ref": job.job_id}, status=status.HTTP_201_CREATED)

    # ── Bulk actions ────────────────────────────────────────────────────────────

    @action(detail=False, methods=["post"], url_path="bulk-status",
            permission_classes=[IsManagerOrAbove])
    def bulk_status(self, request):
        serializer = BulkStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        leads = Lead.objects.filter(pk__in=serializer.validated_data["lead_ids"])
        new_status = serializer.validated_data["status"]
        count = leads.count()
        leads.update(status=new_status)
        return Response({"updated": count, "status": new_status})

    @action(detail=False, methods=["post"], url_path="bulk-assign",
            permission_classes=[IsManagerOrAbove])
    def bulk_assign(self, request):
        serializer = BulkAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(pk=serializer.validated_data["user_id"])
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        leads = Lead.objects.filter(pk__in=serializer.validated_data["lead_ids"])
        count = leads.count()
        leads.update(assigned_to=user)
        return Response({"assigned": count, "to": user.get_full_name() or user.username})

    @action(detail=False, methods=["get"], url_path="export-csv",
            permission_classes=[IsManagerOrAbove])
    def export_csv(self, request):
        """Export filtered leads as CSV."""
        qs = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="leads.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Reference", "Name", "Phone", "Email", "Device", "Brand/Model",
            "Repair Needed", "Area", "Status", "Source", "Assigned To",
            "Created", "UTM Source", "UTM Medium", "UTM Campaign",
        ])
        for lead in qs:
            writer.writerow([
                lead.reference, lead.name, lead.phone, lead.email,
                lead.device_type, lead.brand_model, lead.repair_needed,
                lead.area, lead.status, lead.source,
                lead.assigned_to.get_full_name() if lead.assigned_to else "",
                lead.created_at.strftime("%Y-%m-%d %H:%M"),
                lead.utm_source, lead.utm_medium, lead.utm_campaign,
            ])
        return response

    # ── Dashboard follow-ups ────────────────────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="follow-ups-due")
    def follow_ups_due(self, request):
        """Follow-ups due today for current user."""
        today_end = timezone.now().replace(hour=23, minute=59, second=59)
        fus = FollowUp.objects.filter(
            is_done=False,
            due_at__lte=today_end,
        ).select_related("lead")
        if request.user.role not in ("admin", "manager"):
            fus = fus.filter(created_by=request.user)
        return Response(FollowUpSerializer(fus, many=True).data)
