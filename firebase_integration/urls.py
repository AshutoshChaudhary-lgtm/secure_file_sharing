from django.urls import path
from .views import send_notification, notifications_view

urlpatterns = [
    path('send-notification/', send_notification, name='send_notification'),
    path('notifications/', notifications_view, name='firebase_notifications'),
]