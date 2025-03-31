from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    """
    Custom user model that extends Django's built-in AbstractUser
    to add language learning specific fields like streak count and daily goal.
    """
    streak_count = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    daily_goal = models.IntegerField(default=5)  # Default goal: practice 5 words per day
    
    def update_streak(self):
        """
        Update user's streak based on activity date.
        Increment streak if user was active yesterday or today,
        reset streak otherwise.
        """
        today = timezone.now().date()
        
        # If last_activity_date is not set, this is the first activity
        if not self.last_activity_date:
            self.streak_count = 1
            self.last_activity_date = today
            return
        
        # Calculate the difference between today and last activity
        days_diff = (today - self.last_activity_date).days
        
        if days_diff == 0:
            # Already logged activity today, no change to streak
            pass
        elif days_diff == 1:
            # Activity on consecutive days, increment streak
            self.streak_count += 1
            self.last_activity_date = today
        else:
            # Missed a day or more, reset streak
            self.streak_count = 1
            self.last_activity_date = today
    
    def __str__(self):
        return self.username
