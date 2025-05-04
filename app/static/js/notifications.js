// notifications.js
let notificationCount = 0;

// WebSocket setup for notifications
const setupWebSocket = () => {
    const socket = new WebSocket('ws://localhost:8000/ws/notifications/');

    socket.onopen = function(event) {
        console.log('WebSocket connection established');
    };

    socket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            displayNotification(data);
        } catch (e) {
            console.error('Error processing WebSocket message:', e);
        }
    };

    socket.onclose = function(event) {
        console.log('WebSocket connection closed');
        // Try to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
    };

    socket.onerror = function(error) {
        console.error('WebSocket Error:', error);
    };

    return socket;
};

// Initialize WebSocket when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    setupWebSocket();
});

// Display notification from any source (WebSocket or Firebase)
function displayNotification(data) {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) return;

    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // Different styling based on notification type
    if (data.type === 'file_shared') {
        notification.classList.add('file-shared');
    } else if (data.type === 'comment_added') {
        notification.classList.add('comment-added');
    }
    
    // Create notification content
    const notificationId = `notification-${notificationCount++}`;
    notification.id = notificationId;
    notification.innerHTML = `
        <span class="notification-message">${data.message}</span>
        <button class="notification-close" onclick="dismissNotification('${notificationId}')">×</button>
    `;
    
    notificationArea.appendChild(notification);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        dismissNotification(notificationId);
    }, 10000);
}

// Dismiss a notification
function dismissNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.classList.add('dismissing');
        setTimeout(() => {
            notification.remove();
        }, 300); // Allow time for the dismissing animation
    }
}

// For debugging - manually trigger a notification
function triggerTestNotification() {
    displayNotification({
        type: 'test',
        message: 'This is a test notification',
        timestamp: new Date().toISOString()
    });
}