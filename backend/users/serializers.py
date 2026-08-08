# backend/users/serializers.py
from rest_framework import serializers

from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:  # pyrefly: ignore[bad-override]
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'role', 'phone', 'department', 'employee_id', 'is_staff',
        ]
        read_only_fields = fields


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:  # pyrefly: ignore[bad-override]
        model = CustomUser
        fields = ['first_name', 'last_name']
