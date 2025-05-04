from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
import json

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get username from URL route
        self.username = self.scope['url_route']['kwargs']['username']
        
        try:
            # Get the user from the username
            self.user = await self.get_user_by_username(self.username)
            if not self.user:
                # Reject the connection if user doesn't exist
                await self.close()
                return
                
            self.group_name = f"user_{self.user.id}"
    
            # Join room group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
    
            await self.accept()
        except Exception as e:
            print(f"Error in WebSocket connection: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message', '')

        # Handle incoming messages
        if 'type' in text_data_json:
            message_type = text_data_json['type']
            
            if message_type == 'file_activity':
                # Handle file activity tracking
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'file_activity',
                        'file_id': text_data_json.get('file_id', ''),
                        'activity': text_data_json.get('activity', ''),
                        'user_id': self.user.id
                    }
                )

    async def send_notification(self, event):
        notification = event['notification']

        # Send notification to WebSocket
        await self.send(text_data=json.dumps({
            'notification': notification
        }))
        
    async def file_activity(self, event):
        # Send file activity updates to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'file_activity',
            'file_id': event['file_id'],
            'activity': event['activity'],
            'user_id': event['user_id']
        }))
        
    @database_sync_to_async
    def get_user_by_username(self, username):
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None


class SecureFileConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Accept all connections for now
        await self.accept()
        
        # Join the secure-file group
        await self.channel_layer.group_add(
            "secure_file",
            self.channel_name
        )

    async def disconnect(self, close_code):
        # Leave secure-file group
        await self.channel_layer.group_discard(
            "secure_file",
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        # Handle incoming messages, e.g., file sharing events
        if data.get('type') == 'file_shared':
            # Broadcast to all connected clients
            await self.channel_layer.group_send(
                "secure_file",
                {
                    'type': 'file_shared_notification',
                    'file_id': data.get('file_id'),
                    'shared_by': data.get('shared_by'),
                    'shared_with': data.get('shared_with')
                }
            )

    async def file_shared_notification(self, event):
        # Send file shared notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'file_shared_notification',
            'file_id': event['file_id'],
            'shared_by': event['shared_by'],
            'shared_with': event['shared_with']
        }))