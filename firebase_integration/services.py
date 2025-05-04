from firebase_admin import credentials, messaging, get_app

# Try to get the existing Firebase app instead of initializing a new one
try:
    app = get_app()
except ValueError:
    # This block should not execute if auth.py has already initialized the app correctly
    from firebase_admin import initialize_app
    cred = credentials.Certificate('firebase-credentials.json')
    app = initialize_app(cred, name='messaging-app')

def send_notification(title, body, token):
    """
    Sends a notification to a specific device using Firebase Cloud Messaging.
    
    Args:
        title (str): The title of the notification.
        body (str): The body content of the notification.
        token (str): The device token to which the notification will be sent.
    """
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=token,
    )

    response = messaging.send(message)
    return response

def notify_file_shared(file_name, user_token):
    """
    Notify a user when a file is shared with them.
    
    Args:
        file_name (str): The name of the shared file.
        user_token (str): The device token of the user to notify.
    """
    title = "File Shared"
    body = f"The file '{file_name}' has been shared with you."
    return send_notification(title, body, user_token)

def notify_comment_added(file_name, comment, user_token):
    """
    Notify a user when a comment is added to a file they shared.
    
    Args:
        file_name (str): The name of the file with a new comment.
        comment (str): The content of the comment.
        user_token (str): The device token of the user to notify.
    """
    title = "New Comment on Your File"
    body = f"A new comment has been added to '{file_name}': {comment}"
    return send_notification(title, body, user_token)