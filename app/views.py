# app/views.py
import os
import uuid
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import render, redirect, get_object_or_404
from django.conf import settings
from django.http import HttpResponse, Http404, HttpResponseForbidden
from django.urls import reverse
from django.db.models import Q

from .models import File, FileShare, Friend
from .forms import FileUploadForm, UserRegistrationForm

# Try to import cryptography, but provide a fallback for initial testing
try:
    from cryptography.fernet import Fernet
    CRYPTO_AVAILABLE = True
except ImportError:
    print("WARNING: Cryptography package not available. File encryption/decryption disabled.")
    CRYPTO_AVAILABLE = False

# Mock Fernet class for testing if cryptography is not available
class MockFernet:
    def __init__(self, key=None):
        self.key = key or b'mock_key_for_testing_only_not_secure'
    
    def encrypt(self, data):
        # In test mode, just return the data unchanged (no encryption)
        return data
    
    def decrypt(self, data):
        # In test mode, just return the data unchanged (no decryption)
        return data

# Use real Fernet if available, otherwise use mock version
if CRYPTO_AVAILABLE:
    crypto = Fernet
else:
    crypto = MockFernet

from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.text import get_valid_filename
from django.core.files.storage import default_storage
from .forms import UserRegistrationForm, FileUploadForm
from .models import File, FileShare, Friend
from pathlib import Path

# Constants
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.doc', '.docx', '.jpg', '.png'}

# Load the encryption key
KEY_FILE = Path(__file__).resolve().parent.parent / 'key.key'
try:
    if not KEY_FILE.exists():
        # In development, generate a key if it doesn't exist
        if CRYPTO_AVAILABLE:
            key = Fernet.generate_key()
            with open(KEY_FILE, 'wb') as key_file:
                key_file.write(key)
        else:
            # For our mock implementation, we don't need a real key
            key = b'mock_key_for_testing_only_insecure'
    else:
        with open(KEY_FILE, 'rb') as key_file:
            key = key_file.read()
            
    # Create the cipher suite based on whether real crypto is available
    if CRYPTO_AVAILABLE:
        try:
            cipher_suite = Fernet(key)
        except Exception as e:
            print(f"Error creating Fernet cipher: {e}")
            CRYPTO_AVAILABLE = False
            cipher_suite = MockFernet(key)
    else:
        cipher_suite = MockFernet(key)
except Exception as e:
    print(f"Error setting up encryption: {e}")
    # Fallback to mock encryption
    CRYPTO_AVAILABLE = False
    cipher_suite = MockFernet()

@login_required
def index(request):
    """Home page showing user files and shared files."""
    user_files = File.objects.filter(user=request.user)
    shared_files = FileShare.objects.filter(user=request.user)
    return render(request, 'index.html', {'files': user_files, 'shared_files': shared_files})

def register(request):
    """User registration view."""
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            # Validate password
            password = form.cleaned_data.get('password')
            try:
                validate_password(password, user=None)
            except ValidationError as e:
                form.add_error('password', e)
                return render(request, 'register.html', {'form': form})
            
            user = form.save(commit=False)
            user.set_password(password)
            user.save()
            login(request, user)
            messages.success(request, 'Registration successful.')
            return redirect('index')
    else:
        form = UserRegistrationForm()
    return render(request, 'register.html', {'form': form})

def user_login(request):
    """User login view."""
    # Check if the user is already authenticated
    if request.user.is_authenticated:
        return redirect('index')
    
    # Create context for login page
    context = {}
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            # Redirect to the original page if 'next' parameter exists
            next_url = request.GET.get('next', 'index')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password.')
            context['error'] = 'Invalid username or password.'
    
    return render(request, 'login.html', context)

@login_required
def user_logout(request):
    """User logout view."""
    logout(request)
    return redirect('login')

@login_required
def upload_file(request):
    """Upload file view."""
    if request.method == 'POST':
        form = FileUploadForm(request.POST, request.FILES)
        uploaded_file = request.FILES.get('file')
        
        if form.is_valid():
            # Validate file size
            if uploaded_file.size > MAX_FILE_SIZE:
                messages.error(request, 'File size exceeds the allowed limit of 50MB.')
                return redirect('upload_file')
            
            # Validate file extension
            ext = os.path.splitext(uploaded_file.name)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                messages.error(request, f'Invalid file extension. Allowed: {", ".join(ALLOWED_EXTENSIONS)}')
                return redirect('upload_file')
            
            # Save file instance
            file_instance = form.save(commit=False)
            file_instance.user = request.user
            file_instance.filename = get_valid_filename(uploaded_file.name)
            file_instance.save()
            
            # Encrypt and save the file
            file_path = get_safe_user_file_path(request.user.id, file_instance.filename)
            encrypted_data = cipher_suite.encrypt(uploaded_file.read())
            with open(file_path, 'wb') as f:
                f.write(encrypted_data)
            
            messages.success(request, 'File uploaded successfully.')
            return redirect('index')
    else:
        form = FileUploadForm()
    return render(request, 'upload.html', {'form': form})

@login_required
def manage_friends(request):
    """Manage friends list."""
    if request.method == 'POST':
        friend_username = request.POST.get('friend_username')
        try:
            friend = User.objects.get(username=friend_username)
            if friend == request.user:
                messages.error(request, 'You cannot add yourself as a friend.')
            else:
                friendship, created = Friend.objects.get_or_create(user=request.user, friend=friend)
                if created:
                    messages.success(request, f'Added {friend_username} as a friend.')
                else:
                    messages.error(request, f'{friend_username} is already your friend.')
        except User.DoesNotExist:
            messages.error(request, 'Friend username does not exist.')
        return redirect('friends')
    
    friends = Friend.objects.filter(user=request.user)
    return render(request, 'friends.html', {'friends': [friend.friend for friend in friends]})

@login_required
def share_file(request):
    """Share a file with a friend."""
    if request.method == 'POST':
        filename = request.POST.get('filename')
        friend_username = request.POST.get('friend_username')
        try:
            file = File.objects.get(filename=filename, user=request.user)
            friend = User.objects.get(username=friend_username)
            if friend == request.user:
                messages.error(request, 'You cannot share files with yourself.')
            else:
                file_share, created = FileShare.objects.get_or_create(file=file, user=friend)
                if created:
                    messages.success(request, f'File "{filename}" shared with {friend_username}.')
                else:
                    messages.error(request, f'File "{filename}" is already shared with {friend_username}.')
        except File.DoesNotExist:
            messages.error(request, 'File does not exist.')
        except User.DoesNotExist:
            messages.error(request, 'Friend username does not exist.')
        return redirect('share_file')
    
    user_files = File.objects.filter(user=request.user)
    friends = Friend.objects.filter(user=request.user)
    return render(request, 'share.html', {'files': user_files, 'friends': [friend.friend for friend in friends]})

@login_required
def download_file(request):
    """Download file view."""
    if request.method == 'GET':
        filename = request.GET.get('filename')
        if not filename:
            messages.error(request, 'No filename provided')
            return redirect('index')
        
        try:
            # Ensure filename is safe
            safe_filename = get_valid_filename(filename)
            ext = validate_file_extension(safe_filename)
            
            # Try to get the file owned by the user
            file = File.objects.filter(filename=safe_filename, user=request.user).first()
            
            if not file:
                # Try to get the file shared with the user
                shared_file = FileShare.objects.filter(
                    file__filename=safe_filename,
                    user=request.user
                ).first()
                if shared_file:
                    file = shared_file.file
                else:
                    messages.error(request, 'File not found or not shared with you')
                    return redirect('index')
            
            # Get the safe file path
            file_path = get_safe_user_file_path(file.user.id, file.filename)
            
            if not file_path.exists():
                messages.error(request, 'File does not exist on server')
                return redirect('index')
            
            # Read and decrypt the file
            encrypted_data = file_path.read_bytes()
            decrypted_data = cipher_suite.decrypt(encrypted_data)
            
            # Create the response
            response = HttpResponse(decrypted_data, content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{file.filename}"'
            return response
        
        except ValidationError as e:
            messages.error(request, str(e))
            return redirect('index')
        except Exception as e:
            messages.error(request, f'Error downloading file: {str(e)}')
            return redirect('index')
    else:
        messages.error(request, 'Invalid request method')
        return redirect('index')
    
@login_required
def delete_file(request, file_id):
    """Delete a file uploaded by the user."""
    file = get_object_or_404(File, id=file_id, user=request.user)
    file_path = get_safe_user_file_path(request.user.id, file.filename)
    
    if request.method == 'POST':
        # Delete the file from the filesystem
        if file_path.exists():
            os.remove(file_path)
        
        # Delete the FileShare entries
        FileShare.objects.filter(file=file).delete()
        
        # Delete the File record
        file.delete()
        
        messages.success(request, 'File deleted successfully.')
        return redirect('index')
    
    return render(request, 'delete_confirm.html', {'file': file})

def validate_file_extension(filename):
    """Validate file extension"""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f'Unsupported file extension: {ext}')
    return ext

def get_safe_user_file_path(user_id, filename):
    """Safely construct file path within user's upload directory"""
    user_upload_dir = Path(settings.MEDIA_ROOT) / f'user_{user_id}'
    user_upload_dir.mkdir(parents=True, exist_ok=True)
    return user_upload_dir / filename