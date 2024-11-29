from django.db import models
from django.contrib.auth.models import User

class File(models.Model):
    filename = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    shared_with = models.ManyToManyField(User, related_name='shared_files', through='FileShare')
    
    def __str__(self):
        return f"{self.filename} (Owner: {self.user.username})"

# class Friend(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends')
#     friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_of')
    
#     class Meta:
#         unique_together = ['user', 'friend']
    
#     def __str__(self):
#         return f"{self.user.username} -> {self.friend.username}"

class FileShare(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['file', 'user']
    
    def __str__(self):
        return f"{self.file.filename} shared with {self.user.username}"