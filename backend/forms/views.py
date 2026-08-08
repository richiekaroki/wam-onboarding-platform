# ===== backend/forms/views.py =====
import logging
from typing import cast

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from django.db import models
from django.db.models import Count, F
from django.contrib.auth import get_user_model

from .models import Field, FileUpload, Form, Submission
from .permissions import IsAdminUserOrReadOnly
from .serializers import (
    FieldSerializer,
    FileUploadSerializer,
    FormSerializer,
    SubmissionSerializer,
)
from .services import create_submission, update_submission_status

logger = logging.getLogger(__name__)


class FormViewSet(viewsets.ModelViewSet):
    # Disable throttling for public read endpoints
    throttle_classes = []

    # Gracefully handle protected deletion (forms with submissions)
    def destroy(self, request, *args, **kwargs):
        from django.db.models import ProtectedError
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({'detail': 'Cannot delete form with existing submissions.'}, status=status.HTTP_400_BAD_REQUEST)
    serializer_class = FormSerializer
    lookup_field = 'slug'
    permission_classes = [IsAdminUserOrReadOnly]

    def get_queryset(self):
        qs = Form.objects.prefetch_related('fields', 'assigned_to').annotate(submission_count=Count('submissions')).order_by('-created_at')
        # request.user is typed as AbstractBaseUser by django-stubs, which lacks
        # is_staff. We import CustomUser for the cast so Pyrefly resolves it correctly.
        from users.models import CustomUser
        user = cast(CustomUser | None, self.request.user if self.request.user.is_authenticated else None)
        if not (user and user.is_staff):
            qs = qs.filter(is_active=True)
            # Non-staff users only see forms assigned to them (or unassigned forms)
            if user and user.is_authenticated:
                qs = qs.filter(
                    models.Q(assigned_to=user) | models.Q(assigned_to__isnull=True)
                ).distinct()
        return qs

    def perform_create(self, serializer):
        form = serializer.save()
        logger.info('Form created: %s (slug=%s) by %s', form.name, form.slug, self.request.user)

    def perform_update(self, serializer):
        form = self.get_object()
        # Auto-increment schema_version when schema changes
        new_schema = serializer.validated_data.get('schema')
        if new_schema and new_schema != form.schema:
            form.schema_version += 1
            serializer.save(schema_version=form.schema_version)
            logger.info('Form %s schema updated to version %d', form.slug, form.schema_version)
        else:
            serializer.save()

    @action(detail=False, methods=['get'], url_path='stats', permission_classes=[IsAdminUser])
    def stats(self, request):
        """Return dashboard statistics for admins."""
        from django.db.models import Avg, Count, Q
        from django.utils.timezone import now
        from datetime import timedelta

        total_forms = Form.objects.count()
        active_forms = Form.objects.filter(is_active=True).count()
        total_submissions = Submission.objects.count()

        status_counts = dict(
            Submission.objects.values_list('status').annotate(count=Count('id')).values_list('status', 'count')
        )

        approved = status_counts.get('approved', 0)
        rejected = status_counts.get('rejected', 0)
        approval_rate = round(approved / (approved + rejected) * 100, 1) if (approved + rejected) > 0 else 0

        # Average time from submission to approval (in days)
        approved_subs = Submission.objects.filter(status='approved').exclude(
            updated_at=F('created_at')
        )
        avg_completion = approved_subs.annotate(
            duration=Avg(F('updated_at') - F('created_at'))
        ).values_list('duration', flat=True).first()

        # Recent activity (last 7 days)
        week_ago = now() - timedelta(days=7)
        recent_submissions = Submission.objects.filter(created_at__gte=week_ago).count()

        # Overdue submissions
        from django.utils.timezone import localdate
        overdue = Submission.objects.filter(
            due_date__lt=localdate(),
            is_deleted=False,
        ).exclude(status__in=['approved', 'rejected']).count()

        total_users = get_user_model().objects.count()

        return Response({
            'total_forms': total_forms,
            'active_forms': active_forms,
            'total_submissions': total_submissions,
            'status_counts': status_counts,
            'approval_rate': approval_rate,
            'avg_completion_days': avg_completion.days if avg_completion else None,
            'recent_submissions_7d': recent_submissions,
            'overdue_submissions': overdue,
            'total_users': total_users,
        })

    @action(detail=True, methods=['post', 'delete'], url_path='assign',
            permission_classes=[IsAdminUser])
    def assign_users(self, request, slug=None):
        """POST: add users to form. DELETE: remove users from form.
        Body: { "user_ids": ["uuid1", "uuid2"] }
        """
        form = self.get_object()
        user_ids = request.data.get('user_ids', [])

        if request.method == 'POST':
            form.assigned_to.add(*user_ids)
            logger.info('Users assigned to form %s: %s', form.slug, user_ids)
            return Response({'detail': f'{len(user_ids)} user(s) assigned.'})
        else:  # DELETE
            form.assigned_to.remove(*user_ids)
            logger.info('Users removed from form %s: %s', form.slug, user_ids)
            return Response({'detail': f'{len(user_ids)} user(s) removed.'})


@extend_schema(parameters=[
    OpenApiParameter(name='form_slug', type=OpenApiTypes.STR, location=OpenApiParameter.PATH, description='Slug of the parent Form'),
    OpenApiParameter(name='id', type=OpenApiTypes.INT, location=OpenApiParameter.PATH, description='Field ID')
])
class FieldViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = FieldSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Field.objects.filter(form__slug=self.kwargs['form_slug'])

    def perform_create(self, serializer):
        from django.shortcuts import get_object_or_404
        form = get_object_or_404(Form, slug=self.kwargs['form_slug'])
        serializer.save(form=form)


from rest_framework.throttling import AnonRateThrottle  # noqa: F401 (kept for reference)


@method_decorator(csrf_exempt, name='dispatch')
class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    throttle_classes = []  # Throttling handled by global REST_FRAMEWORK settings

    def get_queryset(self):
        qs = (
            Submission.objects
            .select_related('form', 'submitted_by')
            .prefetch_related('files')
        )
        # Non-staff users can only see their own submissions
        from users.models import CustomUser
        user = cast(CustomUser | None, self.request.user if self.request.user.is_authenticated else None)
        if not (user and user.is_staff):
            if user and user.is_authenticated:
                qs = qs.filter(submitted_by=user)
            else:
                qs = qs.none()
        return qs

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action == 'upload_file':
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        submission = create_submission(
            form=serializer.validated_data['form'],
            responses=serializer.validated_data['responses'],
            submitted_by=user,
            client_identifier=serializer.validated_data.get('client_identifier', ''),
        )
        # Set the instance so DRF returns the created object
        serializer.instance = submission

    @action(detail=True, methods=['post'], url_path='upload',
            parser_classes=[MultiPartParser, FormParser])
    def upload_file(self, request, pk=None):
        submission = self.get_object()

        # Ownership check: only the submitter or admin can upload files
        if request.user.is_authenticated:
            is_owner = submission.submitted_by == request.user
            is_admin = getattr(request.user, 'is_staff', False)
            if not is_owner and not is_admin:
                return Response(
                    {'detail': 'You can only upload files to your own submissions.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            # Anonymous users cannot upload files
            return Response(
                {'detail': 'Authentication required to upload files.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        files = request.FILES.getlist('file')
        field_key = request.data.get('field_key', '')

        if not files:
            return Response({'detail': 'No files provided.'}, status=status.HTTP_400_BAD_REQUEST)
        if not field_key:
            return Response({'detail': 'field_key is required.'}, status=status.HTTP_400_BAD_REQUEST)

        from django.conf import settings as django_settings
        max_size = getattr(django_settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)
        allowed_types = getattr(django_settings, 'ALLOWED_UPLOAD_CONTENT_TYPES', [])

        created = []
        for f in files:
            if f.size > max_size:
                return Response(
                    {'detail': f'File "{f.name}" exceeds maximum size of {max_size // (1024 * 1024)}MB.'},
                    status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                )
            if allowed_types and (f.content_type or '') not in allowed_types:
                return Response(
                    {'detail': f'File type "{f.content_type}" is not allowed. Accepted: {", ".join(allowed_types)}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            fu = FileUpload.objects.create(
                submission=submission, field_key=field_key, file=f,
                original_filename=f.name, content_type=f.content_type or '', file_size=f.size,
            )
            created.append(FileUploadSerializer(fu).data)

        logger.info('%d file(s) uploaded to submission %s (field=%s)', len(created), submission.id, field_key)
        return Response(created, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='status', permission_classes=[IsAdminUser])
    def update_status(self, request, pk=None):
        submission = self.get_queryset().select_for_update().get(pk=pk)
        new_status = request.data.get('status')
        try:
            submission = update_submission_status(submission=submission, new_status=new_status)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(SubmissionSerializer(submission).data)

    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
        """Export submission as a PDF file."""
        from django.http import HttpResponse
        from .pdf import generate_submission_pdf

        submission = self.get_object()
        try:
            pdf_bytes = generate_submission_pdf(submission)
        except Exception:
            logger.exception('Failed to generate PDF for submission %s', pk)
            return Response({'detail': 'Failed to generate PDF.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f'submission-{str(submission.id)[:8]}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response