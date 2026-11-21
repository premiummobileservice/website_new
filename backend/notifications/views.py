"""Notifications views."""
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import EmailLog
from .serializers import EmailLogSerializer


class EmailLogListView(ListAPIView):
    """CRM: email history for a lead (filter by lead_id)."""
    serializer_class = EmailLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["lead_id", "email_type", "status"]

    def get_queryset(self):
        return EmailLog.objects.all()


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings

class TestEmailView(APIView):
    """Trigger a test email to verify SMTP / email delivery settings."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        recipient = request.data.get("email") or (settings.LEAD_NOTIFY_EMAILS[0] if settings.LEAD_NOTIFY_EMAILS else "admin@premiummobilerepair.in")
        try:
            send_mail(
                subject="[Test Email] Premium Mobile Repair CRM Diagnostic Check",
                message=f"This is a test notification from Premium Mobile Repair website & CRM system.\nDispatched to: {recipient}\nStatus: 100% operational.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            return Response({
                "success": True,
                "message": f"Test email dispatched successfully to {recipient}!",
                "backend": settings.EMAIL_BACKEND,
                "recipient": recipient,
            })
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e),
                "backend": settings.EMAIL_BACKEND,
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SendInvoiceEmailView(APIView):
    """Dispatch formal Tax Invoice breakdown to customer email."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = request.data.get("email")
        customer_name = request.data.get("customer_name", "Valued Customer")
        invoice_number = request.data.get("invoice_number", "PMR-INV")
        device = request.data.get("device", "Device")
        amount = request.data.get("amount", "0")
        payment_status = request.data.get("payment_status", "PAID")
        warranty = request.data.get("warranty", "90 Days")

        if not email:
            return Response({"error": "Recipient email address is required"}, status=status.HTTP_400_BAD_REQUEST)

        subject = f"Tax Invoice {invoice_number} - Premium Mobile Repair"
        body = (
            f"Dear {customer_name},\n\n"
            f"Thank you for trusting Premium Mobile Repair Bangalore.\n\n"
            f"Your repair service for {device} has been completed successfully.\n"
            f"Invoice Number: {invoice_number}\n"
            f"Total Amount: Rs. {amount} ({payment_status.upper()})\n"
            f"Service Warranty: {warranty}\n\n"
            f"Workshop Details:\n"
            f"Premium Mobile Repair\n"
            f"#159, 1st Floor 32nd E Cross Rd, Tilak Nagar, Jayanagar, Bengaluru 560041\n"
            f"Phone / WhatsApp: +91 99860 97786\n"
            f"Email: premiummobileservice3@gmail.com\n\n"
            f"Terms & Conditions:\n"
            f"- 90-day warranty covers touch sensitivity and manufacturing defects.\n"
            f"- Physical impact, pressure cracks, and liquid ingress void warranty."
        )

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({"success": True, "message": f"Invoice email dispatched to {email}"})
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

