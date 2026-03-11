from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TrainerViewSet

app_name = "trainers"

router = DefaultRouter()
router.register(r"trainers", TrainerViewSet, basename="trainers")

urlpatterns = [
    path("", include(router.urls)),
]
