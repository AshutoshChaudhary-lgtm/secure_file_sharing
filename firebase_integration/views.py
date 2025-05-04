from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from firebase_integration.database import FirebaseDatabaseService
from django.contrib.auth.models import User  # Changed from CustomUser import
import json
from .services import send_notification as send_notification_service

def send_notification(request):
    if request.method == 'POST':
        message = request.POST.get('message')
        user_id = request.POST.get('user_id')
        
        if message and user_id:
            try:
                # Call the function directly instead of using a class
                response = send_notification_service(
                    title="New Notification",
                    body=message,
                    token=user_id
                )
                return JsonResponse({'status': 'success', 'message': 'Notification sent!'})
            except Exception as e:
                return JsonResponse({'status': 'error', 'message': f'Failed to send notification: {str(e)}'})
        else:
            return JsonResponse({'status': 'error', 'message': 'Invalid data.'})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})

def notifications_view(request):
    return render(request, 'notifications.html')

@login_required
def friends_view(request):
    """
    View for managing friends and friend requests
    """
    current_user = request.user
    
    if request.method == 'POST':
        if 'username' in request.POST:
            # This is now a friend request instead of direct add
            friend_username = request.POST.get('username')
            
            # Don't allow adding yourself
            if friend_username == current_user.username:
                messages.error(request, "You cannot add yourself as a friend.")
                return redirect('friends')
                
            # Send friend request
            success, message = FirebaseDatabaseService.send_friend_request(
                str(current_user.id), 
                friend_username
            )
            
            if success:
                messages.success(request, f"Friend request sent to {friend_username}")
            else:
                messages.error(request, message)
                
            return redirect('friends')
            
        elif 'accept_request' in request.POST:
            # Accept friend request
            sender_id = request.POST.get('accept_request')
            success, message = FirebaseDatabaseService.respond_to_friend_request(
                str(current_user.id),
                sender_id,
                accept=True
            )
            
            if success:
                messages.success(request, "Friend request accepted!")
            else:
                messages.error(request, message)
                
            return redirect('friends')
            
        elif 'reject_request' in request.POST:
            # Reject friend request
            sender_id = request.POST.get('reject_request')
            success, message = FirebaseDatabaseService.respond_to_friend_request(
                str(current_user.id),
                sender_id,
                accept=False
            )
            
            if success:
                messages.success(request, "Friend request rejected")
            else:
                messages.error(request, message)
                
            return redirect('friends')
            
        elif 'remove_friend' in request.POST:
            # Remove friend
            friend_id = request.POST.get('remove_friend')
            success, message = FirebaseDatabaseService.remove_friend(
                str(current_user.id),
                friend_id
            )
            
            if success:
                messages.success(request, "Friend removed successfully")
            else:
                messages.error(request, message)
                
            return redirect('friends')
    
    # Get friend requests and friends list
    friend_requests = FirebaseDatabaseService.get_friend_requests(str(current_user.id))
    friends_list = FirebaseDatabaseService.get_friends(str(current_user.id))
    
    context = {
        'friends': friends_list,
        'incoming_requests': friend_requests['incoming'],
        'outgoing_requests': friend_requests['outgoing']
    }
    
    return render(request, 'friends.html', context)