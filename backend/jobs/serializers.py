"""Jobs app serializers."""
from rest_framework import serializers
from .models import RepairJob, QuoteLine
from accounts.serializers import UserSerializer


class QuoteLineSerializer(serializers.ModelSerializer):
    line_total = serializers.ReadOnlyField()

    class Meta:
        model = QuoteLine
        fields = ["id", "description", "quantity", "unit_price", "line_total"]


class RepairJobSerializer(serializers.ModelSerializer):
    job_number = serializers.CharField(source="job_id", read_only=True)
    quote_lines = QuoteLineSerializer(many=True, read_only=True)
    technician_detail = UserSerializer(source="technician", read_only=True)
    technician_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    customer_address = serializers.SerializerMethodField()
    lead_reference = serializers.SerializerMethodField()

    class Meta:
        model = RepairJob
        fields = [
            "id", "job_id", "job_number",
            "lead", "lead_reference", "customer",
            "customer_name", "customer_phone", "customer_email", "customer_address",
            "technician", "technician_name", "technician_detail",
            "device_description", "imei_serial", "device_condition_notes",
            "pickup_address", "pickup_scheduled_at", "picked_up_at",
            "delivery_address", "delivered_at",
            "status", "diagnosis_notes", "repair_notes",
            "confirmed_issue", "work_performed", "parts_used_notes", "rework_reason",
            "part_name", "vendor_name", "vendor_cost",
            "product_price", "service_charges", "total_customer_charge", "internal_profit",
            "invoice_number",
            "quote_total", "quote_lines", "quote_sent_at", "approved_at",
            "quote_declined_reason",
            "payment_status", "payment_method", "payment_received_at",
            "completed_at", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "job_id", "lead", "customer", "created_at", "updated_at"]

    def get_customer_name(self, obj):
        if obj.customer:
            return obj.customer.name
        if obj.lead:
            return obj.lead.name
        return "Customer"

    def get_customer_phone(self, obj):
        if obj.customer:
            return obj.customer.phone
        if obj.lead:
            return obj.lead.phone
        return ""

    def get_customer_email(self, obj):
        if obj.customer:
            return obj.customer.email
        if obj.lead:
            return obj.lead.email
        return ""

    def get_customer_address(self, obj):
        if obj.pickup_address:
            return obj.pickup_address
        if obj.lead:
            return obj.lead.area
        return ""

    def get_lead_reference(self, obj):
        if obj.lead:
            return obj.lead.reference
        return ""

    def get_technician_name(self, obj):
        if obj.technician:
            return obj.technician.get_full_name() or obj.technician.username
        return None


class RepairJobListSerializer(serializers.ModelSerializer):
    technician_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()

    class Meta:
        model = RepairJob
        fields = [
            "id", "job_id", "device_description", "status",
            "customer_name", "customer_phone",
            "technician", "technician_name",
            "part_name", "vendor_name", "vendor_cost",
            "product_price", "service_charges", "total_customer_charge", "internal_profit",
            "invoice_number", "quote_total", "payment_status", "created_at",
        ]

    def get_technician_name(self, obj):
        if obj.technician:
            return obj.technician.get_full_name() or obj.technician.username
        return None

    def get_customer_name(self, obj):
        if obj.customer:
            return obj.customer.name
        if obj.lead:
            return obj.lead.name
        return "Customer"

    def get_customer_phone(self, obj):
        if obj.customer:
            return obj.customer.phone
        if obj.lead:
            return obj.lead.phone
        return ""
