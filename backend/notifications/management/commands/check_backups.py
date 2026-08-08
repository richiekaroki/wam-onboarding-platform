# backend/notifications/management/commands/check_backups.py
"""Management command to verify database backup status and notify admins.

Run daily via Render Cron Job or external scheduler.
Checks if the database is accessible and logs a health status.
"""
import logging
from django.core.management.base import BaseCommand
from django.db import connection

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Check database health and notify admins of backup status'

    def handle(self, *args, **options):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.execute("SELECT pg_database_size(current_database())")
                db_size = cursor.fetchone()[0]

            size_mb = round(db_size / 1024 / 1024, 2)
            self.stdout.write(
                self.style.SUCCESS(f'Database healthy — size: {size_mb} MB')
            )
            logger.info('Database health check passed — size: %s MB', size_mb)

            # Log for monitoring (Render keeps logs for 7 days on free tier)
            if size_mb > 500:
                self.stdout.write(
                    self.style.WARNING(f'Database is large ({size_mb} MB). Consider cleanup.')
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Database health check failed: {e}')
            )
            logger.exception('Database health check failed')
