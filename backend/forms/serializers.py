# ===== backend/forms/serializers.py =====
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError as DjangoValidationError
import datetime
import decimal

from .models import Field, FileUpload, Form, Submission

User = get_user_model()


class FieldSerializer(serializers.ModelSerializer):
    class Meta:  # pyrefly: ignore
        model = Field
        fields = '__all__'
        read_only_fields = ('id', 'form')


class FormSerializer(serializers.ModelSerializer):
    fields = FieldSerializer(many=True, read_only=True)  # pyrefly: ignore
    submission_count = serializers.IntegerField(read_only=True, default=0)
    assigned_to = serializers.PrimaryKeyRelatedField(
        many=True, queryset=get_user_model().objects.all(), required=False
    )

    class Meta:  # pyrefly: ignore
        model = Form
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'schema_version')


class FileUploadSerializer(serializers.ModelSerializer):
    class Meta:  # pyrefly: ignore
        model = FileUpload
        fields = '__all__'
        read_only_fields = ('id', 'uploaded_at', 'original_filename', 'content_type', 'file_size')


class SubmissionSerializer(serializers.ModelSerializer):
    files = FileUploadSerializer(many=True, read_only=True)

    class Meta:  # pyrefly: ignore
        model = Submission
        fields = '__all__'
        read_only_fields = (
            'id', 'created_at', 'updated_at',
            'submitted_by', 'schema_version', 'status',
            'escalation_level', 'penalty_applied_at', 'last_reminder_sent_at',
        )

    def validate(self, attrs):
        """
        Validate submission payload against the Form's field definitions.
        - Ensures required fields are present.
        - Performs basic type validation for number, email, and date fields.
        - Rejects submissions where the client's schema version is stale.
        """
        form: Form = attrs.get('form')
        responses: dict = attrs.get('responses', {})
        client_schema_version = attrs.get('schema_version')

        if form is None:
            return attrs

        # --- Required fields check ---
        required_fields = (
            form.fields.filter(required=True).exclude(field_type='file').values_list('key', flat=True)
        )
        missing = [key for key in required_fields if key not in responses]
        if missing:
            raise serializers.ValidationError({"responses": f"Missing required fields: {', '.join(missing)}"})

        # --- Type validation for each provided field (excluding file) ---
        for field in form.fields.exclude(field_type='file'):
            key = field.key
            if key not in responses:
                continue  # optional or missing (already checked required above)
            value = responses[key]
            if field.field_type == 'number':
                try:
                    decimal.Decimal(str(value))
                except (decimal.InvalidOperation, ValueError):
                    raise serializers.ValidationError({"responses": f"Field '{key}' must be a number."})
            elif field.field_type == 'email':
                validator = EmailValidator()
                try:
                    validator(value)
                except DjangoValidationError:
                    raise serializers.ValidationError({"responses": f"Field '{key}' must be a valid email address."})
            elif field.field_type == 'date':
                try:
                    datetime.date.fromisoformat(value)
                except (ValueError, TypeError):
                    raise serializers.ValidationError({"responses": f"Field '{key}' must be an ISO date (YYYY-MM-DD)."})
            # Add more type checks as needed (e.g., dropdown, checkbox) – omitted for brevity.

        # --- Schema version consistency ---
        # The client should not manually send schema_version; we enforce that if present it matches.
        if client_schema_version is not None and client_schema_version != form.schema_version:
            raise serializers.ValidationError({"schema_version": "Submission schema version is outdated. Please refresh the form schema."})

        return attrs

    def create(self, validated_data):
        """
        Snapshot the form's current schema_version at submission time.
        This is what makes old submissions survive future schema changes.
        """
        form: Form = validated_data['form']
        validated_data['schema_version'] = form.schema_version
        return super().create(validated_data)