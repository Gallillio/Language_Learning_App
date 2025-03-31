from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Story(models.Model):
    """
    Model for stories in the language learning app
    """
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='authored_stories'
    )
    language = models.CharField(max_length=50)  # e.g., "Spanish", "French"
    difficulty = models.CharField(
        max_length=20, 
        choices=DIFFICULTY_CHOICES,
        default='intermediate'
    )
    tags = models.CharField(max_length=255, blank=True)  # Comma-separated tags
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            # Ensure unique slug
            original_slug = self.slug
            count = 1
            while Story.objects.filter(slug=self.slug).exists():
                self.slug = f"{original_slug}-{count}"
                count += 1
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Stories'
    
    def __str__(self):
        return self.title

class UserStory(models.Model):
    """
    Model for tracking which stories a user has saved to their library
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='saved_stories'
    )
    story = models.ForeignKey(
        Story, 
        on_delete=models.CASCADE,
        related_name='saved_by_users'
    )
    date_added = models.DateTimeField(auto_now_add=True)
    last_read = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('user', 'story')
        ordering = ['-date_added']
        verbose_name_plural = 'User Stories'
    
    def __str__(self):
        return f"{self.user.username} - {self.story.title}"
