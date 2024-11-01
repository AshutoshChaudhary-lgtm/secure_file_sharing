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

def validate_file_extension(filename):
    """Validate file extension"""
    ext = Path(filename).suffix.lower()
    print(f"Validating file extension: {ext}")  # Debugging statement
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

def index(request):
    """Home page view"""
    files = None
    shared_files = None
    if request.user.is_authenticated:
        files = File.objects.filter(user=request.user)
        shared_files = File.objects.filter(shared_with=request.user)
    return render(request, 'index.html', {
        'files': files,
        'shared_files': shared_files
    })

def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            password = form.cleaned_data['password']
            try:
                validate_password(password, user)
                user.set_password(password)
                user.save()
                login(request, user)
                messages.success(request, 'Your account has been created!')
                return redirect('index')
            except ValidationError as e:
                form.add_error('password', e)
    else:
        form = UserRegistrationForm()
    return render(request, 'register.html', {'form': form})

def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('index')
        else:
            messages.error(request, 'Invalid username or password')
    return render(request, 'login.html')

@login_required
def user_logout(request):
    logout(request)
    return redirect('index')

@login_required
def upload_file(request):
    if request.method == 'POST':
        form = FileUploadForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                file = form.save(commit=False)
                file.user = request.user
                
                if 'file' not in request.FILES:
                    raise ValidationError('No file uploaded')
                    
                uploaded_file = request.FILES['file']
                print(f"Uploaded file: {uploaded_file.name}, Size: {uploaded_file.size}")  # Debugging statement
                
                if uploaded_file.size > MAX_FILE_SIZE:
                    raise ValidationError(f'File too large. Max size: {MAX_FILE_SIZE / (1024 * 1024)}MB')
                
                file_data = uploaded_file.read()
                if not file_data:
                    raise ValidationError('Empty file')
                
                # Set filename from uploaded file
                file.filename = uploaded_file.name
                print(f"File.filename set to: {file.filename}")  # Debugging statement
                
                # Get safe file path
                file_path = get_safe_user_file_path(request.user.id, file.filename)
                print(f"Saving file to: {file_path}")  # Debugging statement
                
                # Create directory if needed
                file_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Save encrypted file
                encrypted_data = cipher_suite.encrypt(file_data)
                file_path.write_bytes(encrypted_data)
                print(f"File saved successfully to: {file_path}")  # Debugging statement
                
                file.save()
                messages.success(request, 'File uploaded and encrypted successfully')
                return redirect('index')
                
            except ValidationError as e:
                messages.error(request, str(e))
                print(f"ValidationError: {str(e)}")  # Debugging statement
            except Exception as e:
                messages.error(request, f'Error saving file: {str(e)}')
                print(f"Exception: {str(e)}")  # Debugging statement
                
    else:
        form = FileUploadForm()
    return render(request, 'upload.html', {'form': form})

@login_required
def download_file(request):
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
def manage_friends(request):
    if request.method == 'POST':
        friend_username = request.POST.get('friend_username')
        if not friend_username:
            messages.error(request, 'Please enter a username')
            return redirect('friends')
        
        if friend_username == request.user.username:
            messages.error(request, 'Cannot add yourself as friend')
            return redirect('friends')
            
        friend = User.objects.filter(username=friend_username).first()
        if friend:
            Friend.objects.get_or_create(user=request.user, friend=friend)
            messages.success(request, f'Added {friend_username} as friend')
        else:
            messages.error(request, 'User not found')
    friends = Friend.objects.filter(user=request.user)
    return render(request, 'friends.html', {'friends': friends})

@login_required
def share_file(request):
    if request.method == 'POST':
        filename = request.POST.get('filename')
        friend_username = request.POST.get('friend_username')
        
        if not filename or not friend_username:
            messages.error(request, 'Please provide both filename and friend\'s username')
            return redirect('friends')
        
        try:
            file = File.objects.filter(filename=filename, user=request.user).first()
            friend = User.objects.filter(username=friend_username).first()
            
            if not file:
                messages.error(request, 'File not found')
                return redirect('friends')
            if not friend:
                messages.error(request, 'User not found')
                return redirect('friends')
                
            if friend == request.user:
                messages.error(request, 'Cannot share file with yourself')
                return redirect('friends')
                
            FileShare.objects.get_or_create(file=file, user=friend)
            messages.success(request, f'File shared with {friend_username}')
            
        except Exception as e:
            messages.error(request, f'Error sharing file: {str(e)}')
            print(f"Exception: {str(e)}")  # Debugging statement
            
    return redirect('friends')