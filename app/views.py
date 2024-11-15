# app/views.py
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils.text import get_valid_filename
from django.core.files.storage import default_storage
from django.contrib.auth.models import User
from .forms import UserRegistrationForm, FileUploadForm
from .models import File, FileShare, Friend
from cryptography.fernet import Fernet
import os
from pathlib import Path

# Constants
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.doc', '.docx', '.jpg', '.png'}

# Load the encryption key
KEY_FILE = Path(__file__).resolve().parent.parent / 'key.key'
if not KEY_FILE.exists():
    raise FileNotFoundError(f'Encryption key not found at {KEY_FILE}')
with open(KEY_FILE, 'rb') as key_file:
    key = key_file.read()
cipher_suite = Fernet(key)

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



@login_required
def user_login(request):
    """User login view."""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('index')
        else:
            messages.error(request, 'Invalid username or password.')
    return render(request, 'login.html')

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
        if form.is_valid():
            uploaded_file = form.cleaned_data['file']
            if uploaded_file.size > MAX_FILE_SIZE:
                messages.error(request, 'File size exceeds 50MB limit.')
                return redirect('upload_file')
            ext = Path(uploaded_file.name).suffix.lower()
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
            friend = User.objects.get(username=friend_username)
            file = File.objects.get(filename=filename, user=request.user)
            FileShare.objects.get_or_create(file=file, user=friend)
            messages.success(request, f'File "{filename}" shared with {friend_username}.')
        except User.DoesNotExist:
            messages.error(request, 'Friend username does not exist.')
        except File.DoesNotExist:
            messages.error(request, 'File does not exist.')
        return redirect('friends')
    else:
        messages.error(request, 'Invalid request method.')
        return redirect('friends')

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

def validate_file_extension(filename):
    """Validate file extension"""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f'Invalid file extension. Allowed: {", ".join(ALLOWED_EXTENSIONS)}')
    return ext

def get_safe_user_file_path(user_id, filename):
    """Safely construct file path within user's upload directory"""
    try:
        # Sanitize filename and get extension
        safe_filename = get_valid_filename(filename)
        ext = validate_file_extension(safe_filename)
        
        # Construct base upload path
        base_path = Path(settings.MEDIA_ROOT) / 'uploads' / str(user_id)
        base_path = base_path.resolve()
        
        # Ensure base_path is within MEDIA_ROOT
        if not base_path.is_dir():
            base_path.mkdir(parents=True, exist_ok=True)
        if not str(base_path).startswith(str(settings.MEDIA_ROOT.resolve())):
            raise ValidationError('Invalid base upload path')
        
        # Generate unique filename
        file_path = base_path / safe_filename
        counter = 1
        while file_path.exists():
            name = Path(safe_filename).stem
            file_path = base_path / f"{name}_{counter}{ext}"
            counter += 1
            
        # Verify path is within uploads directory
        if not str(file_path).startswith(str(settings.MEDIA_ROOT.resolve())):
            raise ValidationError('Invalid file path')
            
        return file_path
    except (RuntimeError, OSError) as e:
        raise ValidationError(f'Invalid path: {str(e)}')