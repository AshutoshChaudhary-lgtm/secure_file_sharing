from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse
from .forms import UserRegistrationForm, FileUploadForm
from .models import File, FileShare
from cryptography.fernet import Fernet
import os

# Load the encryption key
KEY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'key.key')
with open(KEY_FILE, 'rb') as key_file:
    key = key_file.read()
cipher_suite = Fernet(key)

def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            login(request, user)
            messages.success(request, 'Your account has been created!')
            return redirect('index')
    else:
        form = UserRegistrationForm()
    return render(request, 'register.html', {'form': form})

def user_login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('index')
        else:
            messages.error(request, 'Invalid username or password')
    return render(request, 'login.html')

def user_logout(request):
    logout(request)
    return redirect('index')

@login_required
def upload_file(request):
    if request.method == 'POST':
        form = FileUploadForm(request.POST, request.FILES)
        if form.is_valid():
            file = form.save(commit=False)
            file.user = request.user
            file_data = request.FILES['file'].read()
            encrypted_data = cipher_suite.encrypt(file_data)
            file_path = os.path.join('uploads', str(request.user.id), file.filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'wb') as encrypted_file:
                encrypted_file.write(encrypted_data)
            file.save()
            messages.success(request, 'File uploaded and encrypted successfully')
            return redirect('index')
    else:
        form = FileUploadForm()
    return render(request, 'upload.html', {'form': form})

@login_required
def download_file(request):
    filename = request.GET.get('filename')
    if not filename:
        messages.error(request, 'No filename provided')
        return redirect('index')
    file = File.objects.filter(filename=filename, user=request.user).first()
    if not file:
        messages.error(request, 'File not found or unauthorized access')
        return redirect('index')
    file_path = os.path.join('uploads', str(request.user.id), filename)
    with open(file_path, 'rb') as encrypted_file:
        encrypted_data = encrypted_file.read()
        decrypted_data = cipher_suite.decrypt(encrypted_data)
    response = HttpResponse(decrypted_data, content_type='application/octet-stream')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response