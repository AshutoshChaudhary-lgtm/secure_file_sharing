from django.test import TestCase
from firebase_integration.services import FirebaseService

class FirebaseIntegrationTests(TestCase):
    def setUp(self):
        self.firebase_service = FirebaseService()

    def test_send_notification(self):
        response = self.firebase_service.send_notification(
            title="Test Notification",
            body="This is a test notification.",
            token="test_token"
        )
        self.assertTrue(response['success'])

    def test_receive_notification(self):
        # This test would require a mock or a test client to simulate receiving notifications
        # Assuming we have a method to simulate receiving notifications
        notification = self.firebase_service.receive_notification()
        self.assertIsNotNone(notification)

    def test_invalid_token(self):
        response = self.firebase_service.send_notification(
            title="Invalid Token Test",
            body="This should fail.",
            token="invalid_token"
        )
        self.assertFalse(response['success'])