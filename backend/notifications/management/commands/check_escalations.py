# backend/notifications/management/commands/check_escalations.py
"""Management command to check and send escalation alerts.

Usage:
    python manage.py check_escalations

Can be run via Render Cron Job or external scheduler.
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Check for overdue submissions and send escalation alerts'

    def handle(self, *args, **options):
        from notifications.tasks import check_escalating_alerts_synchronous

        self.stdout.write('Checking for escalating alerts...')
        result = check_escalating_alerts_synchronous()
        self.stdout.write(self.style.SUCCESS(result))
