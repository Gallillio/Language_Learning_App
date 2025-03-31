from django.db import models
from django.conf import settings
from django.utils import timezone

class DailyActivity(models.Model):
    """
    Model for tracking daily user activity and progress
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='daily_activities'
    )
    date = models.DateField(default=timezone.now)
    
    # Activity counts
    words_added = models.IntegerField(default=0)
    words_practiced = models.IntegerField(default=0)
    words_mastered = models.IntegerField(default=0)
    stories_read = models.IntegerField(default=0)
    
    # Time spent (in minutes)
    time_spent = models.IntegerField(default=0)
    
    # Goal tracking
    daily_goal_completed = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']
        verbose_name_plural = 'Daily Activities'
    
    @classmethod
    def get_or_create_today(cls, user):
        """
        Get or create a daily activity record for today
        """
        today = timezone.now().date()
        activity, created = cls.objects.get_or_create(
            user=user,
            date=today
        )
        return activity
    
    def update_goal_status(self, user):
        """
        Check if the daily goal has been completed
        """
        # Consider the goal completed if words_practiced >= daily_goal
        if self.words_practiced >= user.daily_goal:
            self.daily_goal_completed = True
            self.save()
            return True
        return False
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"
