# backend/users/admin.py
from typing import cast

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, MagicLinkToken

# UserAdmin.fieldsets is a tuple; cast tells type checker it's a tuple
_base_fieldsets = cast(tuple, UserAdmin.fieldsets or ())


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff', 'department')
    list_filter = ('is_staff', 'is_superuser', 'role', 'department')
    search_fields = ('email', 'first_name', 'last_name', 'employee_id')
    list_editable = ('role',)
    ordering = ('-date_joined',)

    fieldsets = (
        ('Credentials', {'fields': ('email', 'username')}),
        ('Personal', {'fields': ('first_name', 'last_name')}),
        ('Mr.Wam Profile', {
            'fields': ('role', 'phone', 'department', 'employee_id'),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser'),
            'classes': ('collapse',),
        }),
    )

    add_fieldsets = (
        ('Credentials', {
            'fields': ('email', 'username'),
        }),
        ('Mr.Wam Profile', {
            'fields': ('role', 'department'),
        }),
    )


@admin.register(MagicLinkToken)
class MagicLinkTokenAdmin(admin.ModelAdmin):
    list_display = ('email', 'token', 'created_at', 'expires_at', 'used')
    list_filter = ('used',)
    search_fields = ('email',)
    readonly_fields = ('token', 'created_at', 'expires_at')
    ordering = ('-created_at',)
