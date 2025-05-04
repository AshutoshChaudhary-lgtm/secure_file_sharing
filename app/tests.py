from django.test import TestCase
from channels.testing import WebsocketCommunicator
from .consumers import NotificationConsumer
from .models import File, Comment
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.testing import ApplicationCommunicator
import json

User = get_user_model()

class NotificationConsumerTests(TestCase):
    async def asyncSetUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.channel_layer = get_channel_layer()
        self.communicator = WebsocketCommunicator(NotificationConsumer.as_asgi(), f"ws/notifications/{self.user.username}/")
        self.connected, _ = await self.communicator.connect()

    async def asyncTearDown(self):
        await self.communicator.disconnect()

    async def test_notification_on_file_share(self):
        file = File.objects.create(name='testfile.txt', owner=self.user)
        await self.communicator.send_json_to({
            'type': 'file.shared',
            'file_id': file.id,
            'shared_with': 'frienduser'
        })
        response = await self.communicator.receive_json_from()
        self.assertEqual(response['type'], 'notification')
        self.assertIn('File shared', response['message'])

    async def test_notification_on_comment(self):
        comment = Comment.objects.create(content='Nice file!', file_id=1, user=self.user)
        await self.communicator.send_json_to({
            'type': 'comment.added',
            'comment_id': comment.id,
            'file_id': comment.file_id
        })
        response = await self.communicator.receive_json_from()
        self.assertEqual(response['type'], 'notification')
        self.assertIn('New comment', response['message'])

    async def test_disconnect(self):
        await self.communicator.disconnect()
        self.assertFalse(self.connected)