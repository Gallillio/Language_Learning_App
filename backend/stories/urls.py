from django.urls import path
from . import views
from .views import UpdateLastReadView

urlpatterns = [
    # Story endpoints will go here
    path('stories/<int:story_id>/update_last_read/', UpdateLastReadView.as_view(), name='update_last_read'),
] 