from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('user/', views.UserDetailView.as_view(), name='user-detail'),
    path('update-streak/', views.UpdateStreakView.as_view(), name='update-streak'),
] 