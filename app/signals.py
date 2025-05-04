from django.dispatch import receiver
from django.db.models.signals import post_save
from .models import File, Comment
from .consumers import NotificationConsumer

@receiver(post_save, sender=File)
def file_shared_notification(sender, instance, created, **kwargs):
    if created:
        message = f"File '{instance.name}' has been shared."
        NotificationConsumer.send_notification(message)

@receiver(post_save, sender=Comment)
def comment_added_notification(sender, instance, created, **kwargs):
    if created:
        message = f"New comment on file '{instance.file.name}': {instance.content}"
        NotificationConsumer.send_notification(message)