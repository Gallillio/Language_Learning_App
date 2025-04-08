from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import UserStory

# Create your views here.

class UpdateLastReadView(APIView):
    """
    API view for updating when a user last read a story.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, story_id):
        try:
            user_story = UserStory.objects.get(user=request.user, story_id=story_id)
            user_story.last_read = timezone.now()
            user_story.save()
            return Response({
                'success': True,
                'last_read': user_story.last_read
            })
        except UserStory.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Story not found in user library'
            }, status=404)
