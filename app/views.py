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
with open(KEY_FILE, 'rb') as key_file:
    key = key_file.read()
cipher_suite = Fernet(key)

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
        
        # Generate unique filename
        file_path = base_path / safe_filename
        counter = 1
        while file_path.exists():
            name = Path(safe_filename).stem
            file_path = base_path / f"{name}_{counter}{ext}"
            counter += 1
            
        # Verify path is within uploads directory
        if not str(file_path).startswith(str(settings.MEDIA_ROOT)):
            raise ValidationError('Invalid file path')
            
        return file_path
        
    except (RuntimeError, OSError) as e:
        raise ValidationError(f'Invalid path: {str(e)}')

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
                if uploaded_file.size > MAX_FILE_SIZE:
                    raise ValidationError(f'File too large. Max size: {MAX_FILE_SIZE/1024/1024}MB')
                
                file_data = uploaded_file.read()
                if not file_data:
                    raise ValidationError('Empty file')
                
                # Get safe file path
                file_path = get_safe_user_file_path(request.user.id, file.filename)
                
                # Create directory if needed
                file_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Save encrypted file
                encrypted_data = cipher_suite.encrypt(file_data)
                file_path.write_bytes(encrypted_data)
                
                file.save()
                messages.success(request, 'File uploaded and encrypted successfully')
                return redirect('index')
                
            except ValidationError as e:
                messages.error(request, str(e))
            except Exception as e:
                messages.error(request, f'Error saving file: {str(e)}')
                
    else:
        form = FileUploadForm()
    return render(request, 'upload.html', {'form': form})

@login_required
def download_file(request):
    try:
        filename = request.GET.get('filename')
        if not filename:
            raise ValidationError('No filename provided')
            
        # Get file record
        file = File.objects.filter(
            filename=filename,
            user=request.user
        ).first()
        
        if not file:
            # Check shared files
            shared_file = FileShare.objects.filter(
                file__filename=filename,
                user=request.user
            ).first()
            if not shared_file:
                raise ValidationError('File not found or unauthorized access')
            file = shared_file.file
            
        # Get safe file path
        file_path = get_safe_user_file_path(file.user.id, filename)
        if not file_path.exists():
            raise ValidationError('File not found')
            
        # Read and decrypt file
        encrypted_data = file_path.read_bytes()
        decrypted_data = cipher_suite.decrypt(encrypted_data)
        
        response = HttpResponse(decrypted_data, content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{file_path.name}"'
        return response
        
    except ValidationError as e:
        messages.error(request, str(e))
    except Exception as e:
        messages.error(request, f'Error reading file: {str(e)}')
    return redirect('index')