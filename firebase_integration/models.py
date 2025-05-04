from django.db import models
from django.contrib.auth.models import User

class FileShareNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255)
    shared_with = models.ManyToManyField(User, related_name='shared_files')
    timestamp = models.DateTimeField(auto_now_add=True)
    message = models.TextField()

    def __str__(self):
        return f"{self.user.username} shared {self.file_name} with {', '.join([user.username for user in self.shared_with.all()])} on {self.timestamp}"

class CommentNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.ForeignKey('app.File', on_delete=models.CASCADE)
    comment = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.file.name} at {self.timestamp}"