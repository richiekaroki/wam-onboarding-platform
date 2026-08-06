# backend/users/urls.py
from django.urls import path

from . import views

urlpatterns = [
    # Return current user's profile (requires JWT token)
    path('me/', views.MeView.as_view(), name='user-me'),
]
