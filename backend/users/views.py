# backend/users/views.py
import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateAPIView
from drf_spectacular.utils import extend_schema

from .serializers import ProfileUpdateSerializer, UserSerializer

logger = logging.getLogger(__name__)


@extend_schema(responses=UserSerializer)
class MeView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user
