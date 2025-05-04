// websocket.js - Enhanced WebSocket functionality for real-time features

class SecureFileWebSocket {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000; // Start with 3 seconds
        this.handlers = {
            'file_activity': [],
            'notification': [],
            'user_status': [],
            'file_update': []
        };
        this.init();
    }

    init() {
        this.connect();
        // Setup periodic ping to keep connection alive
        this.pingInterval = setInterval(() => this.ping(), 30000);
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/secure-file/`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = (event) => {
            console.log('WebSocket connection established');
            this.reconnectAttempts = 0;
            this.reconnectDelay = 3000;
            this.sendAuth();
        };
        
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (e) {
                console.error('Error processing WebSocket message:', e);
            }
        };
        
        this.socket.onclose = (event) => {
            console.log('WebSocket connection closed');
            clearInterval(this.pingInterval);
            
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    this.reconnectDelay *= 1.5; // Exponential backoff
                    this.connect();
                }, this.reconnectDelay);
            } else {
                console.error('Max reconnect attempts reached');
                // Show a UI notification that real-time features are unavailable
                this.showReconnectError();
            }
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }
    
    // Send authentication token after connection
    sendAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            this.send({
                type: 'authenticate',
                token: token
            });
        }
    }
    
    // Periodic ping to keep connection alive
    ping() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.send({
                type: 'ping',
                timestamp: Date.now()
            });
        }
    }
    
    // Send message to server
    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
            return true;
        }
        return false;
    }
    
    // Handle incoming messages
    handleMessage(data) {
        const msgType = data.type || 'unknown';
        
        // Special handling for certain message types
        if (msgType === 'notification') {
            // Use the displayNotification function from notifications.js
            if (typeof displayNotification === 'function') {
                displayNotification(data);
            }
        } else if (msgType === 'file_activity') {
            this.updateFileActivity(data);
        } else if (msgType === 'user_status') {
            this.updateUserStatus(data);
        } else if (msgType === 'file_update') {
            this.updateFileStatus(data);
        } else if (msgType === 'pong') {
            // Received response to our ping
            const latency = Date.now() - data.timestamp;
            console.log(`WebSocket latency: ${latency}ms`);
        }
        
        // Call any registered handlers for this message type
        if (this.handlers[msgType]) {
            this.handlers[msgType].forEach(handler => handler(data));
        }
    }
    
    // Register a handler for a specific message type
    on(type, callback) {
        if (!this.handlers[type]) {
            this.handlers[type] = [];
        }
        this.handlers[type].push(callback);
        return this; // For method chaining
    }
    
    // Remove a handler
    off(type, callback) {
        if (this.handlers[type]) {
            this.handlers[type] = this.handlers[type].filter(handler => handler !== callback);
        }
        return this;
    }
    
    // Show file activity indicators
    updateFileActivity(data) {
        const { fileId, userId, username, action } = data;
        const fileElement = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
        
        if (!fileElement) return;
        
        // Remove any existing activity indicators for this user on this file
        const existingIndicator = fileElement.querySelector(`.activity-indicator[data-user-id="${userId}"]`);
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // If the action is 'end', we just remove the indicator
        if (action === 'end') return;
        
        // Create a new activity indicator
        const activityIndicator = document.createElement('div');
        activityIndicator.className = `activity-indicator ${action}`;
        activityIndicator.setAttribute('data-user-id', userId);
        activityIndicator.innerHTML = `
            <span class="user-initial">${username.charAt(0).toUpperCase()}</span>
            <span class="tooltip-text">${username} is ${action === 'view' ? 'viewing' : 'editing'} this file</span>
        `;
        
        // Add the indicator to the file element
        fileElement.querySelector('.file-icon').appendChild(activityIndicator);
    }
    
    // Update online status of users
    updateUserStatus(data) {
        const { userId, status } = data;
        const userElements = document.querySelectorAll(`.friend-item[data-user-id="${userId}"]`);
        
        userElements.forEach(element => {
            const statusIndicator = element.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.className = `status-indicator ${status}`;
                statusIndicator.setAttribute('title', status === 'online' ? 'Online' : 'Offline');
            }
        });
    }
    
    // Update file status when changes are made
    updateFileStatus(data) {
        const { fileId, action, timestamp, by } = data;
        const fileElement = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
        
        if (!fileElement) return;
        
        // Add visual indicator for updated files
        if (action === 'updated') {
            fileElement.classList.add('file-updated');
            
            // Add "updated" badge if it doesn't exist
            if (!fileElement.querySelector('.update-badge')) {
                const badge = document.createElement('div');
                badge.className = 'update-badge';
                badge.setAttribute('title', `Updated by ${by} on ${new Date(timestamp).toLocaleString()}`);
                badge.innerHTML = '<i class="fas fa-sync-alt"></i>';
                fileElement.querySelector('.file-icon').appendChild(badge);
                
                // Remove the badge after 5 seconds
                setTimeout(() => {
                    badge.classList.add('fade-out');
                    setTimeout(() => badge.remove(), 500);
                }, 5000);
            }
        }
    }
    
    // Show reconnection error message to user
    showReconnectError() {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'websocket-error';
        errorMsg.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Real-time features are currently unavailable. Please refresh the page to try again.</p>
            <button onclick="location.reload()">Refresh</button>
        `;
        document.body.appendChild(errorMsg);
    }
    
    // Start tracking user activity on a file
    startFileActivity(fileId, action = 'view') {
        return this.send({
            type: 'file_activity',
            fileId: fileId,
            action: action,
            timestamp: Date.now()
        });
    }
    
    // End tracking user activity on a file
    endFileActivity(fileId) {
        return this.send({
            type: 'file_activity',
            fileId: fileId,
            action: 'end',
            timestamp: Date.now()
        });
    }
    
    // Clean up resources
    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
        clearInterval(this.pingInterval);
    }
}

// Create a global WebSocket instance
const secureShareWS = new SecureFileWebSocket();

// Export for use in other modules
window.secureShareWS = secureShareWS;

// Automatically track file viewing
document.addEventListener('DOMContentLoaded', function() {
    // Track whenever a file is viewed or clicked
    document.body.addEventListener('click', function(e) {
        const fileItem = e.target.closest('.file-item');
        if (fileItem) {
            const fileId = fileItem.getAttribute('data-file-id');
            if (fileId) {
                secureShareWS.startFileActivity(fileId, 'view');
            }
        }
    });
    
    // Cleanup when page is being unloaded
    window.addEventListener('beforeunload', function() {
        secureShareWS.disconnect();
    });
});