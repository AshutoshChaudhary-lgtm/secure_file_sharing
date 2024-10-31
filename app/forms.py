from django import forms
from django.contrib.auth.models import User
from .models import File

class UserRegistrationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

class FileUploadForm(forms.ModelForm):
    class Meta:
        model = File
        fields = ['filename']