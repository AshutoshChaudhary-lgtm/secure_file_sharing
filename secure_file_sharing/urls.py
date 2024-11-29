# secure_file_sharing/urls.py

from django.contrib import admin
from django.urls import path
from app import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('upload/', views.upload_file, name='upload_file'),
    path('download/', views.download_file, name='download_file'),
    # Removed friends-related URL patterns
    path('delete/<int:file_id>/', views.delete_file, name='delete_file'),  
]