"""Custom User model with role-based access control."""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended user model with role for CRM access control."""

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ADMIN,
    )
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "accounts_user"
        ordering = ["first_name", "last_name"]

    def __str__(self):
        return f"{self.get_full_name() or self.username} (Admin)"

    @property
    def is_admin(self):
        return True

    @property
    def is_manager(self):
        return True

    @property
    def is_telecaller(self):
        return True

    @property
    def is_technician(self):
        return True
