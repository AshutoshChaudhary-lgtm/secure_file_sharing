from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/notifications/(?P<username>\w+)/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/secure-file/$', consumers.SecureFileConsumer.as_asgi()),
]