"""Serializers for leads app."""
import re
import phonenumbers
from rest_framework import serializers
from django.utils import timezone
from .models import Lead, Activity, Note, FollowUp
from accounts.serializers import UserSerializer


# ── Validation helpers ────────────────────────────────────────────────────────

def validate_indian_phone(value: str) -> str:
    """Validate and normalise Indian mobile numbers."""
    # Strip spaces, dashes, parentheses
    cleaned = re.sub(r"[\s\-\(\)]", "", value)
    # Remove country code if present
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("0"):
        cleaned = cleaned[1:]

    if not re.match(r"^[6-9]\d{9}$", cleaned):
        raise serializers.ValidationError(
            "Please enter a valid 10-digit Indian mobile number (starting with 6–9)."
        )
    return cleaned


# ── Public lead submission serializer ─────────────────────────────────────────

class PublicLeadSerializer(serializers.ModelSerializer):
    """
    Used by the public website form.
    Includes honeypot field (website_url) – silently accepted but checked server-side.
    """
    # Honeypot – should always be empty; bots fill it
    website_url = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        help_text="Leave this field empty.",
    )
    phone = serializers.CharField()

    class Meta:
        model = Lead
        fields = [
            # Honeypot
            "website_url",
            # Contact
            "name", "phone", "email",
            # Device
            "device_type", "brand_model", "repair_needed", "area",
            "issue_description",
            # Consent
            "consent",
            # UTM / tracking (read from form hidden fields)
            "utm_source", "utm_medium", "utm_campaign", "utm_term",
            "gclid", "landing_page", "referrer",
        ]

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)
        if "customer_name" in data and not data.get("name"):
            data["name"] = data["customer_name"]
        if "customer_phone" in data and not data.get("phone"):
            data["phone"] = data["customer_phone"]
        if "customer_email" in data and not data.get("email"):
            data["email"] = data["customer_email"]
        if "device_model_text" in data and not data.get("brand_model"):
            data["brand_model"] = data["device_model_text"]
        elif not data.get("brand_model") and (data.get("brand") or data.get("model")):
            b = data.get("brand", "")
            m = data.get("model", "")
            data["brand_model"] = f"{b} {m}".strip() or "Device"

        if "reported_problem" in data and not data.get("repair_needed"):
            data["repair_needed"] = data["reported_problem"]
        elif "issue_type" in data and not data.get("repair_needed"):
            data["repair_needed"] = data["issue_type"]

        if "description" in data and not data.get("issue_description"):
            data["issue_description"] = data["description"]

        if "pickup_area" in data and not data.get("area"):
            pincode = data.get("pickup_pincode", "")
            data["area"] = f"{data['pickup_area']} ({pincode})".strip() if pincode else data["pickup_area"]
        elif data.get("pin_code") and data.get("area") and data.get("pin_code") not in data.get("area", ""):
            data["area"] = f"{data['area']} ({data['pin_code']})"

        if "privacy_consent" in data and "consent" not in data:
            data["consent"] = data["privacy_consent"]
        elif "consent" not in data:
            data["consent"] = True

        if "device_category" in data and not data.get("device_type"):
            cat = str(data["device_category"]).lower()
            if "iphone" in cat or "android" in cat or "phone" in cat:
                data["device_type"] = "smartphone"
            elif "macbook" in cat or "laptop" in cat:
                data["device_type"] = "laptop"
            elif "ipad" in cat or "tablet" in cat:
                data["device_type"] = "tablet"
            elif "watch" in cat:
                data["device_type"] = "smartwatch"
            else:
                data["device_type"] = "other"
        if not data.get("device_type"):
            data["device_type"] = "smartphone"
        return super().to_internal_value(data)

    def validate_phone(self, value):
        return validate_indian_phone(value)

    def validate_consent(self, value):
        if not value:
            raise serializers.ValidationError("You must consent to the privacy policy to submit.")
        return value

    def validate(self, attrs):
        # Honeypot check – mark lead but don't reject (prevents bot enumeration)
        honeypot = attrs.pop("website_url", "")
        attrs["honeypot_triggered"] = bool(honeypot)

        # Determine source from UTM
        utm_source = attrs.get("utm_source", "").lower()
        gclid = attrs.get("gclid", "")
        if gclid or "google" in utm_source:
            attrs["source"] = Lead.Source.GOOGLE_ADS
        elif utm_source:
            attrs["source"] = Lead.Source.OTHER
        else:
            attrs["source"] = Lead.Source.WEBSITE

        return attrs


# ── CRM serializers ────────────────────────────────────────────────────────────

class ActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = ["id", "activity_type", "text", "timestamp", "user_name", "metadata"]

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return "System"


class NoteSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = ["id", "text", "created_at", "updated_at", "user_name"]
        read_only_fields = ["id", "created_at", "updated_at", "user_name"]

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return "Unknown"

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class FollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUp
        fields = ["id", "due_at", "note", "is_done", "done_at", "created_at"]
        read_only_fields = ["id", "created_at", "done_at"]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class LeadListSerializer(serializers.ModelSerializer):
    """Compact serializer for table/kanban views."""
    assigned_to_name = serializers.SerializerMethodField()
    has_job = serializers.SerializerMethodField()
    job_id = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            "id", "reference", "name", "phone", "email", "device_type", "brand_model",
            "repair_needed", "area", "status", "source", "assigned_to_name",
            "callback_date", "callback_time", "callback_notes",
            "rejection_reason", "rejection_notes",
            "product_price", "vendor_cost", "vendor_name",
            "service_charges", "total_customer_charge", "internal_profit",
            "has_job", "job_id", "is_archived",
            "created_at", "updated_at",
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_has_job(self, obj):
        return hasattr(obj, "repair_job") and obj.repair_job is not None

    def get_job_id(self, obj):
        if hasattr(obj, "repair_job") and obj.repair_job is not None:
            return obj.repair_job.job_id
        return None


class LeadDetailSerializer(serializers.ModelSerializer):
    """Full serializer for lead detail view."""
    activities = ActivitySerializer(many=True, read_only=True)
    notes = NoteSerializer(many=True, read_only=True)
    follow_ups = FollowUpSerializer(many=True, read_only=True)
    assigned_to_detail = UserSerializer(source="assigned_to", read_only=True)
    has_job = serializers.SerializerMethodField()
    job_id = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            "id", "reference",
            "name", "phone", "email",
            "device_type", "brand_model", "repair_needed", "area", "issue_description",
            "consent", "status", "lost_reason", "declined_reason",
            "callback_date", "callback_time", "callback_notes",
            "rejection_reason", "rejection_notes",
            "product_price", "vendor_cost", "vendor_name",
            "service_charges", "total_customer_charge", "internal_profit",
            "source", "utm_source", "utm_medium", "utm_campaign", "utm_term",
            "gclid", "landing_page", "referrer",
            "assigned_to", "assigned_to_detail",
            "has_job", "job_id", "is_archived",
            "activities", "notes", "follow_ups",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "reference", "created_at", "updated_at"]

    def get_has_job(self, obj):
        return hasattr(obj, "repair_job") and obj.repair_job is not None

    def get_job_id(self, obj):
        if hasattr(obj, "repair_job") and obj.repair_job is not None:
            return obj.repair_job.job_id
        return None


class LeadCreateManualSerializer(serializers.ModelSerializer):
    """CRM manual lead creation (walk-in / phone call)."""
    phone = serializers.CharField()

    class Meta:
        model = Lead
        fields = [
            "name", "phone", "email",
            "device_type", "brand_model", "repair_needed", "area",
            "issue_description", "source", "assigned_to",
        ]

    def validate_phone(self, value):
        return validate_indian_phone(value)

    def create(self, validated_data):
        validated_data.setdefault("source", Lead.Source.PHONE)
        validated_data["consent"] = True  # Staff-created leads are always consented
        return super().create(validated_data)


class BulkStatusUpdateSerializer(serializers.Serializer):
    lead_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    status = serializers.ChoiceField(choices=Lead.Status.choices)


class BulkAssignSerializer(serializers.Serializer):
    lead_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    user_id = serializers.IntegerField()
