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