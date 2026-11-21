"""Notifications URLs."""
from django.urls import path
from .views import EmailLogListView, TestEmailView, SendInvoiceEmailView

urlpatterns = [
    path("email-log/", EmailLogListView.as_view(), name="email-log"),
    path("test-email/", TestEmailView.as_view(), name="test-email"),
    path("send-invoice-email/", SendInvoiceEmailView.as_view(), name="send-invoice-email"),
]
