from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

User = get_user_model()

class LoginView(ObtainAuthToken):
    """
    API view for user login.
    Returns auth token and user details on successful login.
    """
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            # Return custom error message for invalid credentials
            return Response({
                'non_field_errors': ['Invalid username or password.']
            }, status=status.HTTP_400_BAD_REQUEST)
            
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Call update_streak to update the streak count when user logs in
        user.update_streak()
        user.save()
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'streak_count': user.streak_count,
                'daily_goal': user.daily_goal,
                'last_activity_date': user.last_activity_date
            }
        })

class LogoutView(APIView):
    """
    API view for user logout.
    Requires authentication and deletes the user's token.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Delete the user's token to logout
        request.user.auth_token.delete()
        return Response(status=status.HTTP_200_OK)

class RegisterView(APIView):
    """
    API view for user registration.
    Creates a new user and returns auth token and user details.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        # Get user data from request
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Validate data
        if not username or not email or not password:
            return Response({
                'error': 'Please provide all required fields'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username or email already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Initialize streak to 1 and set last_activity_date for new users
        user.streak_count = 1
        user.last_activity_date = timezone.now().date()
        user.save()
        
        # Generate token for new user
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'streak_count': user.streak_count,
                'daily_goal': user.daily_goal,
                'last_activity_date': user.last_activity_date
            }
        }, status=status.HTTP_201_CREATED)

class UserDetailView(APIView):
    """
    API view to get authenticated user details.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'streak_count': user.streak_count,
            'daily_goal': user.daily_goal,
            'last_activity_date': user.last_activity_date
        })

class UpdateStreakView(APIView):
    """
    API view for efficiently updating a user's streak.
    Should be called once per session to update the streak.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Get current date to check if user already logged in today
        today = timezone.now().date()
        
        # Only update streak if user hasn't already updated it today
        if not user.last_activity_date or user.last_activity_date != today:
            user.update_streak()
            user.save()
            return Response({
                'success': True,
                'streak_count': user.streak_count,
                'last_activity_date': user.last_activity_date
            })
        else:
            # User already logged in today, return current streak without updating
            return Response({
                'success': True,
                'streak_count': user.streak_count,
                'last_activity_date': user.last_activity_date,
                'message': 'Streak already updated today'
            })
