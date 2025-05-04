# Database operations for Firebase integration
from firebase_integration.auth import firebase_db
import json
import base64

class FirebaseDatabaseService:
    @staticmethod
    def save_file_metadata(user_id, file_id, file_name, shared_with=None):
        """
        Save file metadata to Firebase real-time database
        """
        try:
            if shared_with is None:
                shared_with = []
            
            data = {
                "file_id": file_id,
                "file_name": file_name,
                "owner_id": user_id,
                "shared_with": shared_with,
                "timestamp": {".sv": "timestamp"}  # Server timestamp
            }
            
            # Save to files collection
            firebase_db.child("files").child(file_id).set(data)
            
            # Also save to user's files collection
            firebase_db.child("users").child(user_id).child("files").child(file_id).set(True)
            
            return True
        except Exception as e:
            print(f"Error saving file metadata: {e}")
            return False
    
    @staticmethod
    def share_file(file_id, shared_user_id):
        """
        Share a file with another user
        
        Args:
            file_id (str): The ID of the file to share. Must be a string to work with Firebase
            shared_user_id (str): The Firebase UID of the user to share with
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Ensure file_id is a string for Firebase
            file_id = str(file_id)
            
            # First, get the current file data to access its metadata
            file_data = firebase_db.child("files").child(file_id).get().val()
            if not file_data:
                print(f"File {file_id} not found in database")
                return False
                
            # Add user to shared_with array for the file
            shared_with = file_data.get("shared_with", [])
            if not isinstance(shared_with, list):
                shared_with = []
                
            # If the user is not already in the list, add them
            if shared_user_id not in shared_with:
                shared_with.append(shared_user_id)
                firebase_db.child("files").child(file_id).update({"shared_with": shared_with})
            
            # Add file to user's shared_with_me collection
            firebase_db.child("users").child(shared_user_id).child("shared_with_me").child(file_id).set(True)
            
            # Create a notification for the user who received the shared file
            notification_data = {
                "type": "file_shared",
                "file_id": file_id,
                "file_name": file_data["file_name"],
                "shared_by": file_data["owner_id"],
                "timestamp": {".sv": "timestamp"}
            }
            firebase_db.child("users").child(shared_user_id).child("notifications").push(notification_data)
            
            return True
        except Exception as e:
            print(f"Error sharing file: {e}")
            return False
    
    @staticmethod
    def add_comment(file_id, user_id, comment_text):
        """
        Add a comment to a file
        """
        try:
            comment_data = {
                "user_id": user_id,
                "text": comment_text,
                "timestamp": {".sv": "timestamp"}
            }
            
            # Add comment to file's comments collection
            firebase_db.child("files").child(file_id).child("comments").push(comment_data)
            
            return True
        except Exception as e:
            print(f"Error adding comment: {e}")
            return False
    
    @staticmethod
    def get_username_for_uid(uid):
        """
        Gets a username from a Firebase UID
        """
        try:
            user_profile = firebase_db.child("users").child(uid).child("profile").get().val()
            if user_profile and "username" in user_profile:
                return user_profile["username"]
            return "Unknown User"
        except Exception as e:
            print(f"Error getting username for UID: {e}")
            return "Unknown User"
    
    @staticmethod
    def get_user_files(user_id):
        """
        Get all files owned by or shared with a user
        """
        try:
            # Get files owned by user
            owned_files_refs = firebase_db.child("users").child(user_id).child("files").get()
            
            # Get files shared with user
            shared_files_refs = firebase_db.child("users").child(user_id).child("shared_with_me").get()
            
            owned_files = []
            shared_files = []
            
            if owned_files_refs and owned_files_refs.val():
                owned_files_data = owned_files_refs.val()
                # Handle different return types (dictionary vs list)
                if isinstance(owned_files_data, dict):
                    owned_files_ids = list(owned_files_data.keys())
                else:
                    print(f"Owned files data type: {type(owned_files_data)}")
                    owned_files_ids = []
                    # If it's a list of values, try to extract file IDs
                    if isinstance(owned_files_data, list):
                        for i, value in enumerate(owned_files_data):
                            if value:  # If value is True or any non-falsy value
                                owned_files_ids.append(i)
                
                for file_id in owned_files_ids:
                    file_data = firebase_db.child("files").child(file_id).get().val()
                    if file_data:
                        # Add username to the file data
                        file_data['owner_username'] = FirebaseDatabaseService.get_username_for_uid(file_data['owner_id'])
                        owned_files.append(file_data)
            
            if shared_files_refs and shared_files_refs.val():
                shared_files_data = shared_files_refs.val()
                # Handle different return types (dictionary vs list)
                if isinstance(shared_files_data, dict):
                    shared_files_ids = list(shared_files_data.keys())
                else:
                    print(f"Shared files data type: {type(shared_files_data)}")
                    shared_files_ids = []
                    # If it's a list of values, try to extract file IDs
                    if isinstance(shared_files_data, list):
                        for i, value in enumerate(shared_files_data):
                            if value:  # If value is True or any non-falsy value
                                shared_files_ids.append(i)
                
                for file_id in shared_files_ids:
                    file_data = firebase_db.child("files").child(file_id).get().val()
                    if file_data:
                        # Add username to the file data
                        file_data['owner_username'] = FirebaseDatabaseService.get_username_for_uid(file_data['owner_id'])
                        shared_files.append(file_data)
            
            return {
                "owned_files": owned_files,
                "shared_files": shared_files
            }
        except Exception as e:
            print(f"Error getting user files: {e}")
            return {"owned_files": [], "shared_files": []}
    
    @staticmethod
    def remove_file(file_id, user_id):
        """
        Remove file metadata from Firebase real-time database
        """
        try:
            # Get file data to check if this user is the owner
            file_data = firebase_db.child("files").child(file_id).get().val()
            if not file_data:
                return False
                
            if file_data["owner_id"] != user_id:
                return False  # Only the owner can delete a file
            
            # Clean up - find users who have this file shared with them and remove it
            if "shared_with" in file_data and isinstance(file_data["shared_with"], list):
                for shared_user_id in file_data["shared_with"]:
                    firebase_db.child("users").child(shared_user_id).child("shared_with_me").child(file_id).remove()
            
            # Remove from files collection
            firebase_db.child("files").child(file_id).remove()
            
            # Remove from user's files collection
            firebase_db.child("users").child(user_id).child("files").child(file_id).remove()
            
            return True
        except Exception as e:
            print(f"Error removing file metadata: {e}")
            return False

    @staticmethod
    def encode_username(username):
        """
        Encode a username to be safely used in Firebase paths
        Replaces problematic characters like '.', '#', '$', '[', ']' with their url-safe encodings
        """
        import base64
        return base64.urlsafe_b64encode(username.encode()).decode().replace("=", "_")
    
    @staticmethod
    def decode_username(encoded_username):
        """
        Decode a Firebase-safe username back to its original form
        """
        import base64
        # Replace the custom = replacement
        padded = encoded_username.replace("_", "=")
        return base64.urlsafe_b64decode(padded.encode()).decode()
        
    @staticmethod
    def send_friend_request(sender_id, recipient_username):
        """
        Send a friend request to another user
        """
        try:
            # First check if the username exists and get the recipient_id
            recipient_id = None
            
            # Encode the username for Firebase path safety
            encoded_username = FirebaseDatabaseService.encode_username(recipient_username)
            
            # Try the encoded username in the index first
            username_index = firebase_db.child("indexes").child("users_by_username").child(encoded_username).get().val()
            
            if username_index:
                recipient_id = username_index
                print(f"Found user {recipient_username} with ID {recipient_id} using encoded index")
            else:
                # Also try with the non-encoded username (for backward compatibility)
                username_index = firebase_db.child("indexes").child("users_by_username").child(recipient_username).get().val()
                
                if username_index:
                    recipient_id = username_index
                    print(f"Found user {recipient_username} with ID {recipient_id} using non-encoded index")
                    
                    # Update the index with the encoded version for future lookups
                    firebase_db.child("indexes").child("users_by_username").child(encoded_username).set(recipient_id)
                else:
                    # Scan all users if index not found (slower fallback method)
                    all_users = firebase_db.child("users").get().val()
                    if all_users:
                        for user_id, user_data in all_users.items():
                            username_found = False
                            
                            # Check for username in various possible locations
                            if "profile" in user_data and "username" in user_data["profile"]:
                                if user_data["profile"]["username"] == recipient_username:
                                    username_found = True
                            # Alternative location - directly in user data
                            elif "username" in user_data:
                                if user_data["username"] == recipient_username:
                                    username_found = True
                            # Another possible location - in user_info
                            elif "user_info" in user_data and "username" in user_data["user_info"]:
                                if user_data["user_info"]["username"] == recipient_username:
                                    username_found = True
                                    
                            if username_found:
                                recipient_id = user_id
                                # Create the index for future lookups - using encoded username
                                firebase_db.child("indexes").child("users_by_username").child(encoded_username).set(user_id)
                                print(f"Found user {recipient_username} with ID {recipient_id} via user scan")
                                break
            
            if not recipient_id:
                print(f"Recipient with username {recipient_username} not found")
                return False, "User not found"
            
            # Check if we already sent a friend request
            existing_request = firebase_db.child("friend_requests").child(recipient_id).child(sender_id).get().val()
            if existing_request:
                return False, "Friend request already sent"
                
            # Check if they're already friends
            existing_friendship = firebase_db.child("friends").child(sender_id).child(recipient_id).get().val()
            if existing_friendship:
                return False, "You are already friends with this user"
                
            # Create the friend request
            request_data = {
                "status": "pending",
                "timestamp": {".sv": "timestamp"}
            }
            
            # Save under recipient's incoming requests
            firebase_db.child("friend_requests").child(recipient_id).child(sender_id).set(request_data)
            
            # Save under sender's outgoing requests
            firebase_db.child("friend_requests_sent").child(sender_id).child(recipient_id).set(request_data)
            
            # Create a notification for the recipient
            notification_data = {
                "type": "friend_request",
                "from_id": sender_id,
                "status": "pending",
                "timestamp": {".sv": "timestamp"}
            }
            firebase_db.child("users").child(recipient_id).child("notifications").push(notification_data)
            
            return True, "Friend request sent successfully"
        except Exception as e:
            print(f"Error sending friend request: {e}")
            return False, f"Error: {str(e)}"

    @staticmethod
    def get_friend_requests(user_id):
        """
        Get all pending friend requests for a user
        """
        try:
            # Get incoming friend requests
            incoming_requests_ref = firebase_db.child("friend_requests").child(user_id).get()
            
            incoming_requests = []
            if incoming_requests_ref and incoming_requests_ref.val():
                incoming_data = incoming_requests_ref.val()
                if incoming_data and isinstance(incoming_data, dict):
                    for sender_id, request_data in incoming_data.items():
                        if request_data["status"] == "pending":
                            # Get sender username
                            sender_username = "Unknown"
                            sender_profile = firebase_db.child("users").child(sender_id).child("profile").get().val()
                            if sender_profile and "username" in sender_profile:
                                sender_username = sender_profile["username"]
                                
                            request_info = {
                                "id": sender_id,
                                "username": sender_username,
                                "timestamp": request_data.get("timestamp", 0)
                            }
                            incoming_requests.append(request_info)
            
            # Get outgoing friend requests
            outgoing_requests_ref = firebase_db.child("friend_requests_sent").child(user_id).get()
            
            outgoing_requests = []
            if outgoing_requests_ref and outgoing_requests_ref.val():
                outgoing_data = outgoing_requests_ref.val()
                if outgoing_data and isinstance(outgoing_data, dict):
                    for recipient_id, request_data in outgoing_data.items():
                        if request_data["status"] == "pending":
                            # Get recipient username
                            recipient_username = "Unknown"
                            recipient_profile = firebase_db.child("users").child(recipient_id).child("profile").get().val()
                            if recipient_profile and "username" in recipient_profile:
                                recipient_username = recipient_profile["username"]
                                
                            request_info = {
                                "id": recipient_id,
                                "username": recipient_username,
                                "timestamp": request_data.get("timestamp", 0)
                            }
                            outgoing_requests.append(request_info)
            
            return {
                "incoming": incoming_requests,
                "outgoing": outgoing_requests
            }
        except Exception as e:
            print(f"Error getting friend requests: {e}")
            return {"incoming": [], "outgoing": []}

    @staticmethod
    def respond_to_friend_request(user_id, sender_id, accept=True):
        """
        Accept or reject a friend request
        """
        try:
            # Check if the friend request exists
            request = firebase_db.child("friend_requests").child(user_id).child(sender_id).get().val()
            
            if not request or request["status"] != "pending":
                return False, "Friend request not found or already processed"
                
            if accept:
                # Update request status
                firebase_db.child("friend_requests").child(user_id).child(sender_id).update({"status": "accepted"})
                firebase_db.child("friend_requests_sent").child(sender_id).child(user_id).update({"status": "accepted"})
                
                # Add to friends lists for both users
                firebase_db.child("friends").child(user_id).child(sender_id).set(True)
                firebase_db.child("friends").child(sender_id).child(user_id).set(True)
                
                # Create notifications for both users
                # For the acceptor
                notification_data = {
                    "type": "friend_accepted",
                    "friend_id": sender_id,
                    "timestamp": {".sv": "timestamp"}
                }
                firebase_db.child("users").child(user_id).child("notifications").push(notification_data)
                
                # For the sender
                notification_data = {
                    "type": "friend_request_accepted",
                    "friend_id": user_id,
                    "timestamp": {".sv": "timestamp"}
                }
                firebase_db.child("users").child(sender_id).child("notifications").push(notification_data)
                
                return True, "Friend request accepted"
            else:
                # Update request status
                firebase_db.child("friend_requests").child(user_id).child(sender_id).update({"status": "rejected"})
                firebase_db.child("friend_requests_sent").child(sender_id).child(user_id).update({"status": "rejected"})
                
                return True, "Friend request rejected"
        except Exception as e:
            print(f"Error responding to friend request: {e}")
            return False, f"Error: {str(e)}"

    @staticmethod
    def get_friends(user_id):
        """
        Get all friends for a user
        """
        try:
            friends_ref = firebase_db.child("friends").child(user_id).get()
            
            friends = []
            if friends_ref and friends_ref.val():
                friends_data = friends_ref.val()
                if friends_data and isinstance(friends_data, dict):
                    for friend_id in friends_data:
                        # Get friend username and other info
                        friend_username = "Unknown"
                        friend_profile = firebase_db.child("users").child(friend_id).child("profile").get().val()
                        if friend_profile and "username" in friend_profile:
                            friend_username = friend_profile["username"]
                            
                        friend_info = {
                            "id": friend_id,
                            "username": friend_username
                        }
                        friends.append(friend_info)
            
            return friends
        except Exception as e:
            print(f"Error getting friends: {e}")
            return []

    @staticmethod
    def remove_friend(user_id, friend_id):
        """
        Remove a friend connection
        """
        try:
            # Remove from both users' friend lists
            firebase_db.child("friends").child(user_id).child(friend_id).remove()
            firebase_db.child("friends").child(friend_id).child(user_id).remove()
            
            return True, "Friend removed successfully"
        except Exception as e:
            print(f"Error removing friend: {e}")
            return False, f"Error: {str(e)}"