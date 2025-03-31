from django.db import models
from django.conf import settings
from django.utils import timezone

class Word(models.Model):
    """
    Model for words or phrases that users are learning
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='learning_words'
    )
    word = models.CharField(max_length=255)
    meaning = models.TextField()
    context = models.TextField(blank=True)  # Example sentence or context
    language = models.CharField(max_length=50)  # e.g., "Spanish", "French"
    
    # Track learning progress
    confidence = models.IntegerField(default=1)  # 1-5 scale
    learned = models.BooleanField(default=False)
    
    # Track metadata
    times_practiced = models.IntegerField(default=0)
    date_added = models.DateTimeField(auto_now_add=True)
    last_practiced = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'word', 'language')
        ordering = ['-last_practiced']
    
    def __str__(self):
        return f"{self.word} ({self.language})"
    
    def practice(self):
        """
        Record that this word has been practiced
        """
        self.times_practiced += 1
        self.last_practiced = timezone.now()
        self.save()
    
    def update_confidence(self, level):
        """
        Update the confidence level for this word
        """
        # Ensure level is between 1 and 5
        level = max(1, min(5, level))
        self.confidence = level
        
        # Automatically mark as learned if confidence is 5
        if level == 5:
            self.learned = True
        
        self.practice()
    
    def mark_as_learned(self):
        """
        Mark this word as learned
        """
        self.learned = True
        self.confidence = 5
        self.practice()
    
    def unmark_as_learned(self):
        """
        Unmark this word as learned
        """
        self.learned = False
        self.confidence = 3  # Reset to medium confidence
        self.practice()
