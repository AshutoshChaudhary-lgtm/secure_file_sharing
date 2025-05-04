from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),  # Add this line for the root URL
    path('notifications/', views.notifications_view, name='notifications'),
    path('upload/', views.upload_file, name='upload_file'),
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),  # Add logout URL
    path('friends/', views.manage_friends, name='friends'), 
    path('delete/<int:file_id>/', views.delete_file, name='delete_file'),
    path('download/<int:file_id>/', views.download_file, name='download_file'),
    path('share/', views.share_file, name='share_file'),
    path('comment/<int:file_id>/', views.comment_on_file, name='comment_on_file'),
]