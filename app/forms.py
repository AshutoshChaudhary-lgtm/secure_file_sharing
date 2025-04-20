# app/forms.py
from django import forms
from django.contrib.auth.models import User
from .models import File

class UserRegistrationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

class FileUploadForm(forms.ModelForm):
    file = forms.FileField(help_text="Select a file to upload (max 50MB)")
    
    class Meta:
        model = File
        fields = ['filename']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['filename'].required = False  # We'll set this from the uploaded file