from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import File, Comment
from .utils import encrypt_file, decrypt_file
from firebase_integration.auth import FirebaseAuthService, firebase_db
from firebase_integration.database import FirebaseDatabaseService
import json
import os
import tempfile
import uuid

def register(request):
    """
    Register a new user with Firebase authentication
    """
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        # Create user in Firebase
        firebase_user = FirebaseAuthService.sign_up(email, password)
        
        if firebase_user:
            # Create user in Django
            try:
                user = User.objects.create_user(username=username, email=email, password=password)
                user.save()
                
                # Auto-login the user
                login(request, user)
                
                # Store Firebase UID in session
                firebase_uid = firebase_user['localId']
                request.session['firebase_uid'] = firebase_uid
                request.session['firebase_token'] = firebase_user['idToken']
                
                # Create user profile in Firebase
                firebase_db.child("users").child(firebase_uid).child("profile").update({
                    "username": username,
                    "email": email
                })
                
                # Create username index for efficient lookups
                firebase_db.child("indexes").child("users_by_username").child(username).set(firebase_uid)
                
                return redirect('index')
            except Exception as e:
                error_message = f"Error creating user: {str(e)}"
                return render(request, 'register.html', {'error': error_message})
        else:
            # Provide a more specific error message
            error_message = "Error creating user in Firebase. Please check server logs for details."
            
            # Check for common issues
            if not email or '@' not in email:
                error_message = "Please provide a valid email address."
            elif not password or len(password) < 6:
                error_message = "Password must be at least 6 characters long."
                
            return render(request, 'register.html', {'error': error_message})
    
    return render(request, 'register.html')

def user_login(request):
    """
    Login a user with Firebase authentication
    """
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        # Get user email from username
        try:
            user = User.objects.get(username=username)
            email = user.email
            
            # Authenticate with Firebase
            firebase_user = FirebaseAuthService.sign_in(email, password)
            
            if firebase_user:
                # Authenticate with Django
                user = authenticate(request, username=username, password=password)
                
                if user is not None:
                    login(request, user)
                    
                    # Store Firebase UID in session
                    request.session['firebase_uid'] = firebase_user['localId']
                    request.session['firebase_token'] = firebase_user['idToken']
                    
                    return redirect('index')
                else:
                    return render(request, 'login.html', {'error': 'Invalid credentials'})
            else:
                return render(request, 'login.html', {'error': 'Firebase authentication failed'})
            
        except User.DoesNotExist:
            return render(request, 'login.html', {'error': 'User does not exist'})
    
    return render(request, 'login.html')

def user_logout(request):
    """
    Logout a user and clear Firebase session
    """
    # Clear Firebase session data
    if 'firebase_uid' in request.session:
        del request.session['firebase_uid']
    
    if 'firebase_token' in request.session:
        del request.session['firebase_token']
    
    # Logout from Django
    logout(request)
    
    return redirect('login')

@login_required
def index(request):
    """
    Main dashboard showing user's files
    """
    # Get Firebase UID from session
    firebase_uid = request.session.get('firebase_uid')
    
    if firebase_uid:
        # Get user's files from Firebase
        files_data = FirebaseDatabaseService.get_user_files(firebase_uid)
        
        # Check if it's an AJAX request (for file sharing from friends page)
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse(files_data)
        
        context = {
            'owned_files': files_data['owned_files'],
            'shared_files': files_data['shared_files']
        }
        
        return render(request, 'index.html', context)
    else:
        # If no Firebase UID, redirect to login
        return redirect('login')

@login_required
def upload_file(request):
    """
    Upload a file and save metadata to Firebase with encryption
    """
    if request.method == 'POST' and request.FILES.get('file'):
        uploaded_file = request.FILES['file']
        
        # Create a temporary file to store the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = temp_file.name
            for chunk in uploaded_file.chunks():
                temp_file.write(chunk)
        
        try:
            # Save file metadata to database first to generate a proper path
            file_obj = File.objects.create(
                user=request.user,
                file_name=uploaded_file.name,
                file_path=uploaded_file,  # This will be automatically saved to the correct user folder
            )
            
            # Get the path where Django saved the file
            original_path = file_obj.get_absolute_path()
            
            # Create encrypted file path by appending .enc to the original path
            encrypted_path = original_path + '.enc'
            
            # Encrypt the file
            encryption_success = encrypt_file(temp_path, encrypted_path)
            
            if encryption_success:
                # Delete the original unencrypted file
                if os.path.exists(original_path):
                    os.remove(original_path)
                
                # Rename encrypted file to the original name
                os.rename(encrypted_path, original_path)
                
                # Mark the file as encrypted in the database
                file_obj.encrypted = True
                file_obj.save()
            
            # Get Firebase UID from session
            firebase_uid = request.session.get('firebase_uid')
            
            if firebase_uid:
                # Save file metadata to Firebase
                FirebaseDatabaseService.save_file_metadata(
                    user_id=firebase_uid,
                    file_id=str(file_obj.id),
                    file_name=file_obj.file_name
                )
        
        finally:
            # Clean up the temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
        return redirect('index')
    
    return render(request, 'upload.html')

@login_required
def share_file(request):
    """
    Share a file with another user
    """
    if request.method == 'POST':
        file_id = request.POST.get('file_id')
        friend_username = request.POST.get('friend_username')
        friend_id = request.POST.get('friend_id')
        
        try:
            # Ensure file_id is an integer
            try:
                file_id = int(file_id)
            except (ValueError, TypeError):
                return JsonResponse({'status': 'error', 'message': 'Invalid file ID format'})
            
            # Get the friend's user object
            if friend_username:
                friend = User.objects.get(username=friend_username)
            elif friend_id:
                friend = User.objects.get(id=friend_id)
            else:
                return JsonResponse({'status': 'error', 'message': 'No friend specified'})
            
            # Check if the file exists and is owned by the current user
            file_obj = File.objects.get(id=file_id, user=request.user)
            
            # Get Firebase UIDs
            firebase_uid = request.session.get('firebase_uid')
            
            # Try to find friend's Firebase UID using the username index first (efficient method)
            # Encode the username for Firebase path safety
            if friend_username:
                encoded_username = FirebaseDatabaseService.encode_username(friend_username)
                friend_firebase_uid = firebase_db.child("indexes").child("users_by_username").child(encoded_username).get().val()
            else:
                friend_firebase_uid = friend_id
            
            # If not found in index, fall back to scanning all users (legacy method)
            if not friend_firebase_uid:
                all_users = firebase_db.child("users").get().val()
                
                if all_users:
                    for user_id, user_data in all_users.items():
                        if "profile" in user_data and "username" in user_data["profile"]:
                            if user_data["profile"]["username"] == friend.username:
                                friend_firebase_uid = user_id
                                # Create the index for future lookups
                                firebase_db.child("indexes").child("users_by_username").child(friend.username).set(user_id)
                                break
            
            if not friend_firebase_uid:
                return JsonResponse({'status': 'error', 'message': 'Friend\'s Firebase account not found'})
            
            # Share file in Firebase - Convert file_id to string for Firebase
            success = FirebaseDatabaseService.share_file(str(file_id), friend_firebase_uid)
            
            if success:
                return JsonResponse({'status': 'success', 'message': f'File shared successfully with {friend.username}'})
            else:
                return JsonResponse({'status': 'error', 'message': 'Error sharing file in Firebase'})
            
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Friend not found'})
        except File.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'File not found or you don\'t have permission'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': f'Error sharing file: {str(e)}'})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

@login_required
def comment_on_file(request, file_id):
    """
    Add a comment to a file
    """
    try:
        file_obj = get_object_or_404(File, id=file_id)
        
        if request.method == 'POST':
            content = request.POST.get('comment', '').strip()
            
            if not content:
                return JsonResponse({'status': 'error', 'message': 'Comment cannot be empty'})
            
            # Create the comment
            comment = Comment.objects.create(
                file=file_obj,
                user=request.user,
                content=content
            )
            
            # Redirect back to the download page
            return redirect('download_file', file_id=file_id)
            
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'})
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error adding comment: {str(e)}'})

@login_required
def download_file(request, file_id):
    """
    Download a file from the server with decryption
    """
    try:
        # Get the file object
        file_obj = File.objects.get(id=file_id)
        
        # Check if this is a direct download request
        if request.GET.get('download') == 'true':
            # Check if user has permission to download the file
            # (Either owner or shared with the user)
            if file_obj.user == request.user:
                # User is the owner
                file_path = file_obj.file_path.path
                
                # Check if file exists
                if os.path.exists(file_path):
                    # Handle decryption if the file is encrypted
                    if file_obj.encrypted:
                        # Create a temporary file for the decrypted content
                        temp_dir = tempfile.gettempdir()
                        decrypted_path = os.path.join(temp_dir, f"decrypted_{uuid.uuid4()}_{file_obj.file_name}")
                        
                        # Decrypt the file
                        decryption_success = decrypt_file(file_path, decrypted_path)
                        
                        if decryption_success:
                            # Create file response from the decrypted file
                            from django.http import FileResponse
                            from django.utils.encoding import smart_str
                            
                            response = FileResponse(open(decrypted_path, 'rb'))
                            response['Content-Disposition'] = f'attachment; filename="{smart_str(file_obj.file_name)}"'
                            
                            # Set up a callback to delete the temp file after the response is sent
                            # Note: This is a simplified approach; a more robust solution would use middleware
                            request._decrypted_file_path = decrypted_path
                            
                            def close_and_delete_file(response):
                                response.close()
                                if hasattr(request, '_decrypted_file_path'):
                                    if os.path.exists(request._decrypted_file_path):
                                        os.remove(request._decrypted_file_path)
                            
                            response.close = lambda: close_and_delete_file(response)
                            return response
                        else:
                            return JsonResponse({'status': 'error', 'message': 'Error decrypting file'})
                    else:
                        # File is not encrypted, return it directly
                        from django.http import FileResponse
                        from django.utils.encoding import smart_str
                        
                        response = FileResponse(open(file_path, 'rb'))
                        response['Content-Disposition'] = f'attachment; filename="{smart_str(file_obj.file_name)}"'
                        return response
                else:
                    return JsonResponse({'status': 'error', 'message': 'File not found on server'})
            else:
                # Check if file is shared with the user
                # This would be a check in Firebase to see if the file is shared with this user
                firebase_uid = request.session.get('firebase_uid')
                
                # For now, we'll allow the download (you should implement proper permission checking)
                file_path = file_obj.file_path.path
                
                # Check if file exists
                if os.path.exists(file_path):
                    # Handle decryption if the file is encrypted
                    if file_obj.encrypted:
                        # Create a temporary file for the decrypted content
                        temp_dir = tempfile.gettempdir()
                        decrypted_path = os.path.join(temp_dir, f"decrypted_{uuid.uuid4()}_{file_obj.file_name}")
                        
                        # Decrypt the file
                        decryption_success = decrypt_file(file_path, decrypted_path)
                        
                        if decryption_success:
                            # Create file response from the decrypted file
                            from django.http import FileResponse
                            from django.utils.encoding import smart_str
                            
                            response = FileResponse(open(decrypted_path, 'rb'))
                            response['Content-Disposition'] = f'attachment; filename="{smart_str(file_obj.file_name)}"'
                            
                            # Set up a callback to delete the temp file after the response is sent
                            request._decrypted_file_path = decrypted_path
                            
                            def close_and_delete_file(response):
                                response.close()
                                if hasattr(request, '_decrypted_file_path'):
                                    if os.path.exists(request._decrypted_file_path):
                                        os.remove(request._decrypted_file_path)
                            
                            response.close = lambda: close_and_delete_file(response)
                            return response
                        else:
                            return JsonResponse({'status': 'error', 'message': 'Error decrypting file'})
                    else:
                        # File is not encrypted, return it directly
                        from django.http import FileResponse
                        from django.utils.encoding import smart_str
                        
                        response = FileResponse(open(file_path, 'rb'))
                        response['Content-Disposition'] = f'attachment; filename="{smart_str(file_obj.file_name)}"'
                        return response
                else:
                    return JsonResponse({'status': 'error', 'message': 'File not found on server'})
        else:
            # This is a request to view the file details with comments
            # Get comments for this file
            comments = Comment.objects.filter(file=file_obj).order_by('-created_at')
            
            context = {
                'file': file_obj,
                'comments': comments
            }
            
            return render(request, 'download.html', context)
    
    except File.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'File not found'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error downloading file: {str(e)}'})

@login_required
def delete_file(request, file_id):
    """
    Delete a file from the server
    """
    try:
        # Get the file object
        file_obj = File.objects.get(id=file_id)
        
        # Check if user is the owner
        if file_obj.user == request.user:
            # Delete file from Firebase first
            firebase_uid = request.session.get('firebase_uid')
            if firebase_uid:
                # Remove file metadata from Firebase
                # Note: In a complete implementation, you should also remove shares and comments
                FirebaseDatabaseService.remove_file(file_id, firebase_uid)
            
            # Delete the physical file
            if os.path.exists(file_obj.file_path.path):
                os.remove(file_obj.file_path.path)
            
            # Delete the file object from the database
            file_obj.delete()
            
            return redirect('index')
        else:
            # User is not the owner, return error
            return JsonResponse({'status': 'error', 'message': 'You do not have permission to delete this file'})
    
    except File.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'File not found'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error deleting file: {str(e)}'})

@login_required
def manage_friends(request):
    """
    View for managing friends list and friend requests
    """
    # Get Firebase UID from session
    firebase_uid = request.session.get('firebase_uid')
    
    if request.method == 'POST':
        if 'add_friend' in request.POST:
            # Send a new friend request
            friend_username = request.POST.get('username')
            
            # Make sure we have a username
            if not friend_username:
                return JsonResponse({'status': 'error', 'message': 'Username is required'})
                
            # Make sure user is not adding themselves
            if friend_username == request.user.username:
                return JsonResponse({'status': 'error', 'message': 'You cannot add yourself as a friend'})
            
            # Server-side validation to ensure the username follows the required pattern
            import re
            if not re.match(r'^[a-zA-Z0-9_-]+$', friend_username):
                return JsonResponse({'status': 'error', 'message': 'Invalid username format. Usernames can only contain letters, numbers, underscores and hyphens.'})
                
            # Call Firebase service to send friend request
            success, message = FirebaseDatabaseService.send_friend_request(firebase_uid, friend_username)
            
            if success:
                return JsonResponse({'status': 'success', 'message': message})
            else:
                return JsonResponse({'status': 'error', 'message': message})
        
        elif 'accept_request' in request.POST:
            # Accept a friend request
            sender_id = request.POST.get('friend_id')
            success, message = FirebaseDatabaseService.respond_to_friend_request(firebase_uid, sender_id, accept=True)
            
            if success:
                return JsonResponse({'status': 'success', 'message': message})
            else:
                return JsonResponse({'status': 'error', 'message': message})
                
        elif 'reject_request' in request.POST:
            # Reject a friend request
            sender_id = request.POST.get('friend_id')
            success, message = FirebaseDatabaseService.respond_to_friend_request(firebase_uid, sender_id, accept=False)
            
            if success:
                return JsonResponse({'status': 'success', 'message': message})
            else:
                return JsonResponse({'status': 'error', 'message': message})
        
        elif 'remove_friend' in request.POST:
            # Remove a friend
            friend_id = request.POST.get('friend_id')
            success, message = FirebaseDatabaseService.remove_friend(firebase_uid, friend_id)
            
            if success:
                return JsonResponse({'status': 'success', 'message': message})
            else:
                return JsonResponse({'status': 'error', 'message': message})
    
    # For GET requests, display the friends page with current friends and requests
    context = {}
    
    if firebase_uid:
        # Get user's friends
        friends = FirebaseDatabaseService.get_friends(firebase_uid)
        
        # Get friend requests
        friend_requests = FirebaseDatabaseService.get_friend_requests(firebase_uid)
        
        context = {
            'friends': friends,
            'incoming_requests': friend_requests['incoming'],
            'outgoing_requests': friend_requests['outgoing']
        }
    
    return render(request, 'friends.html', context)

@login_required
def notifications_view(request):
    """
    View for showing real-time notifications
    """
    return render(request, 'notifications.html')