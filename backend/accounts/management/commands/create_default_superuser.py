import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create a default superuser from environment variables if none exists."

    def handle(self, *args, **options):
        User = get_user_model()

        identifier = os.getenv("DJANGO_SUPERUSER_USERNAME") or os.getenv("DJANGO_SUPERUSER_EMAIL")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "")
        role_name = os.getenv("DJANGO_SUPERUSER_ROLE", "admin")

        if not identifier or not password:
            self.stdout.write("Default superuser env vars not set; skipping.")
            return

        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write("Superuser already exists; skipping.")
            return

        lookup = {User.USERNAME_FIELD: identifier}
        user = User.objects.filter(**lookup).first()
        if user:
            user.is_superuser = True
            user.is_staff = True
            update_fields = ["is_superuser", "is_staff", "password"]
            if hasattr(user, "role_name") and not getattr(user, "role_name", None):
                user.role_name = role_name
                update_fields.append("role_name")
            if email and not user.email:
                user.email = email
                update_fields.append("email")
            user.set_password(password)
            user.save(update_fields=update_fields)
            self.stdout.write("Existing user promoted to superuser.")
            return

        extra_fields = {}
        if hasattr(User, "role_name"):
            extra_fields["role_name"] = role_name

        User.objects.create_superuser(identifier, email or None, password, **extra_fields)
        self.stdout.write("Default superuser created.")
