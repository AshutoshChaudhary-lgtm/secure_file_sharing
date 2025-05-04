from django.db import models
from django.contrib.auth.models import User
from .utils import get_user_upload_path

class File(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255)
    file_path = models.FileField(upload_to=get_user_upload_path)
    encrypted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name

    def get_absolute_path(self):
        """Get the absolute file system path of the file"""
        from django.conf import settings
        import os
        return os.path.join(settings.MEDIA_ROOT, self.file_path.name)

class Comment(models.Model):
    file = models.ForeignKey(File, related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.user.username} on {self.file.file_name}'