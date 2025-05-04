// main.js - Core interactive functionality for SecureShare

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeTooltips();
    setupFileExplorer();
    setupSearchFunctionality();
    setupNotificationSystem();
    initializeProgressBars();
    setupDragAndDropUpload();
    setupFileSorting();
    setupFileFiltering();
    initializeUserActivityTracker();
    setupFileInteractions();
    initializeRealTimeFeatures();
});

// Theme management (light/dark mode)
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme') || 
                        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    
    // Update toggle button state
    updateThemeToggle(savedTheme === 'dark');
    
    // Handle theme toggle click
    themeToggle.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-theme');
        updateThemeToggle(isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });
}

function updateThemeToggle(isDarkMode) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    themeToggle.innerHTML = isDarkMode ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
    themeToggle.setAttribute('aria-label', isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode');
}

// Initialize tooltips for better UX
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', e => {
            const tooltipText = e.target.getAttribute('data-tooltip');
            
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            
            document.body.appendChild(tooltip);
            
            const rect = e.target.getBoundingClientRect();
            tooltip.style.top = `${rect.bottom + 10}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            
            e.target.addEventListener('mouseleave', () => {
                tooltip.remove();
            }, { once: true });
        });
    });
}

// File Explorer setup
function setupFileExplorer() {
    const fileExplorer = document.getElementById('file-explorer');
    if (!fileExplorer) return;
    
    // Add file item click event
    fileExplorer.addEventListener('click', e => {
        const fileItem = e.target.closest('.file-item');
        if (!fileItem) return;
        
        // Remove active class from all file items
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked item
        fileItem.classList.add('active');
        
        // Show file options for the selected file
        const fileId = fileItem.getAttribute('data-file-id');
        showFileOptions(fileId);
    });
}

// Show file options menu for a selected file
function showFileOptions(fileId) {
    const fileOptions = document.getElementById('file-options');
    if (!fileOptions) return;
    
    // Get file details from data attribute or fetch from server
    const fileItem = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
    const fileName = fileItem.querySelector('.file-name').textContent;
    
    // Update file options panel
    fileOptions.innerHTML = `
        <h3>${fileName}</h3>
        <div class="file-actions">
            <button class="btn btn-primary btn-sm" onclick="downloadFile('${fileId}')">
                <i class="fas fa-download"></i> Download
            </button>
            <button class="btn btn-secondary btn-sm" onclick="shareFile('${fileId}')">
                <i class="fas fa-share-alt"></i> Share
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteFile('${fileId}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
        <div class="file-details">
            <p><strong>Size:</strong> <span id="file-size">Calculating...</span></p>
            <p><strong>Uploaded:</strong> <span id="file-date">Loading...</span></p>
            <p><strong>Shared with:</strong></p>
            <ul id="shared-with-list" class="shared-users-list">
                <li>Loading...</li>
            </ul>
        </div>
    `;
    
    // Show the file options panel
    fileOptions.style.display = 'block';
    
    // Fetch and fill in file details (simulated)
    fetchFileDetails(fileId);
}

// Fetch file details from Firebase
function fetchFileDetails(fileId) {
    // In a real implementation, this would fetch from Firebase
    // For now, we'll simulate with setTimeout
    setTimeout(() => {
        document.getElementById('file-size').textContent = '3.2 MB';
        document.getElementById('file-date').textContent = 'May 2, 2025';
        
        const sharedWithList = document.getElementById('shared-with-list');
        sharedWithList.innerHTML = ''; // Clear loading state
        
        // Example shared users (in real app, fetch from Firebase)
        const sharedWith = ['user1', 'user2'];
        
        if (sharedWith.length === 0) {
            sharedWithList.innerHTML = '<li>Not shared with anyone</li>';
        } else {
            sharedWith.forEach(user => {
                sharedWithList.innerHTML += `
                    <li>
                        <span class="user-avatar">${user.charAt(0).toUpperCase()}</span>
                        ${user}
                        <button class="btn-icon" onclick="removeSharedUser('${fileId}', '${user}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </li>
                `;
            });
        }
    }, 500);
}

// Search functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.toLowerCase();
        searchFiles(searchTerm);
        
        // Add search history (if term is not empty and user pressed Enter)
        if (e.keyCode === 13 && searchTerm.trim() !== '') {
            addSearchHistory(searchTerm);
        }
    }, 300));
    
    // Clear search button
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchFiles('');
        });
    }
}

// Debounce helper function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function searchFiles(term) {
    const fileItems = document.querySelectorAll('.file-item');
    
    if (term === '') {
        // If search is cleared, show all files
        fileItems.forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }
    
    // Filter files based on search term
    fileItems.forEach(item => {
        const fileName = item.querySelector('.file-name').textContent.toLowerCase();
        if (fileName.includes(term)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Add search term to search history
function addSearchHistory(term) {
    // Get existing search history from localStorage or initialize empty array
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Add new term if it's not already in history
    if (!searchHistory.includes(term)) {
        // Add to beginning of array and limit to 10 items
        searchHistory.unshift(term);
        if (searchHistory.length > 10) {
            searchHistory.pop();
        }
        
        // Save updated history
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        
        // Update search history UI if it exists
        updateSearchHistoryUI();
    }
}

function updateSearchHistoryUI() {
    const searchHistoryContainer = document.getElementById('search-history');
    if (!searchHistoryContainer) return;
    
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Clear existing history items
    searchHistoryContainer.innerHTML = '';
    
    // Add history items
    searchHistory.forEach(term => {
        const historyItem = document.createElement('div');
        historyItem.className = 'search-history-item';
        historyItem.innerHTML = `
            <span>${term}</span>
            <button class="btn-icon" onclick="removeSearchHistoryItem('${term}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add click event to fill search input with this term
        historyItem.addEventListener('click', () => {
            document.getElementById('search-input').value = term;
            searchFiles(term);
        });
        
        searchHistoryContainer.appendChild(historyItem);
    });
}

function removeSearchHistoryItem(term) {
    // Get existing search history
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Remove the term
    const updatedHistory = searchHistory.filter(item => item !== term);
    
    // Save updated history
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    
    // Update UI
    updateSearchHistoryUI();
}

// Enhanced notification system
function setupNotificationSystem() {
    // This function will set up advanced notification handling
    // The actual notifications are handled in notifications.js
    
    // Add a notification counter in the header
    const notificationIcon = document.querySelector('nav a[href*="notifications"]');
    if (notificationIcon) {
        const counter = document.createElement('span');
        counter.className = 'notification-counter';
        counter.id = 'notification-counter';
        counter.textContent = '0';
        notificationIcon.appendChild(counter);
    }
}

// Update notification counter
function updateNotificationCounter(count) {
    const counter = document.getElementById('notification-counter');
    if (!counter) return;
    
    counter.textContent = count;
    counter.style.display = count > 0 ? 'block' : 'none';
    
    // Add pulse animation when new notifications arrive
    if (count > 0) {
        counter.classList.add('pulse');
        setTimeout(() => {
            counter.classList.remove('pulse');
        }, 1000);
    }
}

// Initialize progress bars for uploads and downloads
function initializeProgressBars() {
    // This will be used for showing upload/download progress
    // We'll implement it with specific file events
}

// File upload progress tracker
function updateProgressBar(progressBarId, percentage) {
    const progressBar = document.getElementById(progressBarId);
    if (!progressBar) return;
    
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    
    // Update text inside progress bar
    const progressText = progressBar.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `${Math.round(percentage)}%`;
    }
}

// Handle file upload with progress tracking
function uploadFileWithProgress(file, onProgress, onComplete, onError) {
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);
    
    // Create and configure XHR request
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
            
            // Notify other users about upload progress via WebSocket
            if (window.secureShareWS && percentComplete % 20 < 1) { // Only send updates at ~0%, ~20%, ~40%, ~60%, ~80%, ~100%
                window.secureShareWS.send({
                    type: 'file_upload_progress',
                    fileName: file.name,
                    progress: percentComplete
                });
            }
        }
    });
    
    // Handle completion
    xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = JSON.parse(xhr.responseText);
                onComplete(response);
                
                // Notify other users about completed upload
                if (window.secureShareWS) {
                    window.secureShareWS.send({
                        type: 'file_upload_complete',
                        fileId: response.id,
                        fileName: response.name
                    });
                }
            } catch (e) {
                onError('Invalid server response');
            }
        } else {
            onError(`Upload failed: ${xhr.statusText}`);
        }
    });
    
    // Handle errors
    xhr.addEventListener('error', () => {
        onError('Network error occurred during upload');
    });
    
    xhr.addEventListener('abort', () => {
        onError('Upload was aborted');
    });
    
    // Open and send the request
    xhr.open('POST', '/upload/');
    xhr.send(formData);
    
    // Return the XHR object for potential abort
    return xhr;
}

// Share file with friends function
function shareFile(fileId) {
    // Show sharing modal
    const modal = document.getElementById('share-modal');
    if (!modal) {
        // Create modal if it doesn't exist
        createShareModal(fileId);
    } else {
        // Update existing modal with file info
        updateShareModal(fileId);
    }
}

// Create sharing modal
function createShareModal(fileId) {
    const modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Share File</h3>
                <button class="close-btn" onclick="closeModal('share-modal')">×</button>
            </div>
            <div class="modal-body">
                <div class="file-to-share">
                    <i class="fas fa-file"></i>
                    <span id="share-file-name">Loading...</span>
                </div>
                
                <div class="form-group">
                    <label for="share-username">Share with (username):</label>
                    <div class="input-with-icon">
                        <input type="text" id="share-username" class="form-control" placeholder="Enter username">
                        <i class="fas fa-search"></i>
                    </div>
                </div>
                
                <div class="friends-list" id="friends-share-list">
                    Loading your friends...
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('share-modal')">Cancel</button>
                <button class="btn btn-primary" id="confirm-share-btn">Share</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Fetch file details
    const fileItem = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
    if (fileItem) {
        const fileName = fileItem.querySelector('.file-name').textContent;
        document.getElementById('share-file-name').textContent = fileName;
    }
    
    // Load friends list (simulated)
    loadFriendsList(fileId);
    
    // Setup sharing confirmation
    document.getElementById('confirm-share-btn').addEventListener('click', () => {
        const username = document.getElementById('share-username').value.trim();
        if (username) {
            confirmFileSharing(fileId, username);
        } else {
            // Get selected friends from list
            const selectedFriends = document.querySelectorAll('#friends-share-list .friend-item.selected');
            const usernames = Array.from(selectedFriends).map(el => el.getAttribute('data-username'));
            
            if (usernames.length > 0) {
                confirmFileSharing(fileId, usernames);
            } else {
                alert('Please enter a username or select friends to share with');
            }
        }
    });
}

// Close any modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300); // Wait for close animation
}

// Load friends list
function loadFriendsList(fileId) {
    const friendsList = document.getElementById('friends-share-list');
    if (!friendsList) return;
    
    // In real app, fetch from Firebase
    // Simulated friends list for now
    setTimeout(() => {
        friendsList.innerHTML = '';
        
        const friends = [
            {username: 'friend1', name: 'John Doe', isOnline: true},
            {username: 'friend2', name: 'Jane Smith', isOnline: false}
        ];
        
        if (friends.length === 0) {
            friendsList.innerHTML = '<p>You have no friends yet. Add friends to share files with them.</p>';
            return;
        }
        
        friends.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.className = 'friend-item';
            friendItem.setAttribute('data-username', friend.username);
            
            friendItem.innerHTML = `
                <div class="friend-avatar">
                    ${friend.name.charAt(0).toUpperCase()}
                    <span class="status-indicator ${friend.isOnline ? 'online' : 'offline'}"></span>
                </div>
                <div class="friend-info">
                    <h4>${friend.name}</h4>
                    <p>@${friend.username}</p>
                </div>
            `;
            
            // Make friend item selectable
            friendItem.addEventListener('click', () => {
                friendItem.classList.toggle('selected');
            });
            
            friendsList.appendChild(friendItem);
        });
    }, 500);
}

// Confirm file sharing
function confirmFileSharing(fileId, recipients) {
    // Show loading state
    const shareBtn = document.getElementById('confirm-share-btn');
    shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sharing...';
    shareBtn.disabled = true;
    
    // In real app, share via Firebase
    // Simulated sharing for now
    setTimeout(() => {
        // Show success message
        const modal = document.getElementById('share-modal');
        modal.querySelector('.modal-body').innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <h4>File Shared Successfully</h4>
                <p>Your file has been shared with the selected recipients.</p>
            </div>
        `;
        
        // Update modal footer
        modal.querySelector('.modal-footer').innerHTML = `
            <button class="btn btn-primary" onclick="closeModal('share-modal')">Done</button>
        `;
        
        // Create notification
        displayNotification({
            type: 'file_shared',
            message: `You shared a file with ${Array.isArray(recipients) ? recipients.length : 1} people`,
            timestamp: new Date().toISOString()
        });
    }, 1500);
}

// Drag and Drop File Upload functionality
function setupDragAndDropUpload() {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Handle paste from clipboard (for images)
    document.addEventListener('paste', handlePaste, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropZone.classList.add('highlight');
        // Add animated border
        dropZone.classList.add('pulse-border');
    }
    
    function unhighlight() {
        dropZone.classList.remove('highlight');
        dropZone.classList.remove('pulse-border');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    function handlePaste(e) {
        if (e.clipboardData && e.clipboardData.files.length > 0) {
            handleFiles(e.clipboardData.files);
        }
    }
    
    function handleFiles(files) {
        [...files].forEach(uploadFile);
    }
    
    function uploadFile(file) {
        // Create upload progress UI
        const progressElement = createProgressElement(file);
        dropZone.after(progressElement);
        
        // Start the upload
        const xhr = uploadFileWithProgress(
            file,
            (progress) => {
                updateProgressElement(progressElement, progress, file);
            },
            (response) => {
                completeProgressElement(progressElement, response);
                // Show success message
                showToast(`File "${file.name}" uploaded successfully!`, 'success');
                // Refresh file list
                refreshFileList();
            },
            (error) => {
                failProgressElement(progressElement, error);
                showToast(`Upload failed: ${error}`, 'error');
            }
        );
        
        // Add cancel button functionality
        progressElement.querySelector('.cancel-upload').addEventListener('click', () => {
            xhr.abort();
            progressElement.remove();
            showToast(`Upload of "${file.name}" cancelled`, 'info');
        });
    }
    
    function createProgressElement(file) {
        const element = document.createElement('div');
        element.className = 'upload-progress-item';
        
        // Determine file type icon
        const fileExt = file.name.split('.').pop().toLowerCase();
        let fileIcon = 'fa-file';
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExt)) {
            fileIcon = 'fa-file-image';
        } else if (['pdf'].includes(fileExt)) {
            fileIcon = 'fa-file-pdf';
        } else if (['doc', 'docx'].includes(fileExt)) {
            fileIcon = 'fa-file-word';
        } else if (['xls', 'xlsx'].includes(fileExt)) {
            fileIcon = 'fa-file-excel';
        } else if (['zip', 'rar', '7z'].includes(fileExt)) {
            fileIcon = 'fa-file-archive';
        } else if (['mp3', 'wav', 'ogg'].includes(fileExt)) {
            fileIcon = 'fa-file-audio';
        } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExt)) {
            fileIcon = 'fa-file-video';
        } else if (['txt', 'rtf'].includes(fileExt)) {
            fileIcon = 'fa-file-alt';
        }
        
        element.innerHTML = `
            <div class="file-info">
                <i class="fas ${fileIcon} file-icon"></i>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: 0%"></div>
                <div class="progress-text">0%</div>
            </div>
            <div class="upload-actions">
                <button class="cancel-upload btn-icon" title="Cancel Upload">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        return element;
    }
    
    function updateProgressElement(element, progress, file) {
        const progressBar = element.querySelector('.progress-bar');
        const progressText = element.querySelector('.progress-text');
        
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
        
        // Add animation effect for smoother visual update
        progressBar.style.transition = 'width 0.3s ease-in-out';
        
        // Update upload speed and estimated time if progress changed significantly
        if (progress % 5 < 1 && progress > 0) {
            const fileSize = formatFileSize(file.size);
            const uploadSpeed = calculateUploadSpeed(file, progress);
            const timeRemaining = calculateTimeRemaining(file, progress, uploadSpeed);
            
            element.querySelector('.file-size').textContent = 
                `${formatFileSize(file.size * (progress/100))} of ${fileSize} - ${uploadSpeed}/s, ${timeRemaining} left`;
        }
    }
    
    function completeProgressElement(element, response) {
        element.classList.add('upload-complete');
        
        const progressContainer = element.querySelector('.progress-container');
        progressContainer.innerHTML = `
            <div class="progress-bar" style="width: 100%"></div>
            <div class="progress-text">
                <i class="fas fa-check"></i> Complete
            </div>
        `;
        
        const uploadActions = element.querySelector('.upload-actions');
        uploadActions.innerHTML = `
            <button class="view-file btn-icon" title="View File" 
                onclick="window.location.href='/download/${response.id}/'">
                <i class="fas fa-eye"></i>
            </button>
            <button class="share-file btn-icon" title="Share File"
                onclick="shareFile('${response.id}')">
                <i class="fas fa-share-alt"></i>
            </button>
        `;
        
        // Add a subtle animation
        element.animate([
            { backgroundColor: '#d4edda' },
            { backgroundColor: 'transparent' }
        ], {
            duration: 1500,
            easing: 'ease-out'
        });
        
        // Remove the progress element after 5 seconds
        setTimeout(() => {
            element.classList.add('fade-out');
            setTimeout(() => element.remove(), 500);
        }, 5000);
    }
    
    function failProgressElement(element, error) {
        element.classList.add('upload-error');
        
        const progressContainer = element.querySelector('.progress-container');
        progressContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i> 
                ${error}
            </div>
        `;
        
        const uploadActions = element.querySelector('.upload-actions');
        uploadActions.innerHTML = `
            <button class="retry-upload btn-icon" title="Retry">
                <i class="fas fa-redo"></i>
            </button>
            <button class="dismiss-error btn-icon" title="Dismiss">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listeners for retry and dismiss
        element.querySelector('.retry-upload').addEventListener('click', () => {
            element.remove();
            uploadFile(file);
        });
        
        element.querySelector('.dismiss-error').addEventListener('click', () => {
            element.classList.add('fade-out');
            setTimeout(() => element.remove(), 500);
        });
    }
}

// Helper for file upload progress tracking
function calculateUploadSpeed(file, progress) {
    // This would need to be enhanced with actual time tracking
    // For now, we'll return a placeholder value
    const randomSpeed = 0.5 + Math.random() * 2; // Between 0.5 and 2.5 MB/s
    return `${randomSpeed.toFixed(1)} MB`;
}

function calculateTimeRemaining(file, progress, speed) {
    // This would need to be enhanced with actual time tracking
    // For now, we'll return a placeholder value based on file size and progress
    const remainingPercent = 100 - progress;
    const remainingSizeInMB = (file.size * (remainingPercent / 100)) / (1024 * 1024);
    
    // Parse the speed value (remove the " MB" part and convert to number)
    const speedValue = parseFloat(speed.split(' ')[0]);
    
    // Calculate remaining time in seconds
    const remainingTimeInSeconds = remainingSizeInMB / speedValue;
    
    // Format the time
    if (remainingTimeInSeconds < 60) {
        return `${Math.round(remainingTimeInSeconds)}s`;
    } else if (remainingTimeInSeconds < 3600) {
        return `${Math.round(remainingTimeInSeconds / 60)}m ${Math.round(remainingTimeInSeconds % 60)}s`;
    } else {
        const hours = Math.floor(remainingTimeInSeconds / 3600);
        const minutes = Math.round((remainingTimeInSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

// Helper for formatting file sizes
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    // Create toast container if it doesn't exist
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icon based on type
    let icon;
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
        default:
            icon = 'fa-info-circle';
    }
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="toast-message">${message}</div>
        <button class="toast-close">&times;</button>
    `;
    
    // Add toast to container
    document.getElementById('toast-container').appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Add click listener for close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }
    }, 5000);
}

// Refresh file list via AJAX
function refreshFileList() {
    const fileExplorer = document.getElementById('file-explorer');
    if (!fileExplorer) return;
    
    // Show loading indicator
    fileExplorer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading files...</div>';
    
    // Fetch updated file list
    fetch('/api/files/')
        .then(response => response.json())
        .then(data => {
            fileExplorer.innerHTML = ''; // Clear loading indicator
            
            if (data.length === 0) {
                fileExplorer.innerHTML = '<div class="no-files">No files found. Upload some files to get started!</div>';
                return;
            }
            
            // Render each file
            data.forEach(file => {
                const fileElement = createFileElement(file);
                fileExplorer.appendChild(fileElement);
            });
            
            // Restart tracking of visible files
            trackVisibleFiles();
        })
        .catch(error => {
            console.error('Error fetching files:', error);
            fileExplorer.innerHTML = '<div class="error-message">Error loading files. Please try again.</div>';
        });
}

// Create a file element for the file list
function createFileElement(file) {
    const fileElement = document.createElement('div');
    fileElement.className = 'file-item';
    fileElement.setAttribute('data-file-id', file.id);
    fileElement.setAttribute('data-file-name', file.name);
    fileElement.setAttribute('data-file-size', file.size);
    fileElement.setAttribute('data-file-type', file.type);
    fileElement.setAttribute('data-file-date', file.date_uploaded);
    
    // Determine file type and icon
    const fileExt = file.name.split('.').pop().toLowerCase();
    let fileIcon = 'fa-file';
    let fileTypeClass = 'file-other';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExt)) {
        fileIcon = 'fa-file-image';
        fileTypeClass = 'file-image';
    } else if (['pdf'].includes(fileExt)) {
        fileIcon = 'fa-file-pdf';
        fileTypeClass = 'file-pdf';
    } else if (['doc', 'docx'].includes(fileExt)) {
        fileIcon = 'fa-file-word';
        fileTypeClass = 'file-document';
    } else if (['xls', 'xlsx'].includes(fileExt)) {
        fileIcon = 'fa-file-excel';
        fileTypeClass = 'file-spreadsheet';
    } else if (['zip', 'rar', '7z'].includes(fileExt)) {
        fileIcon = 'fa-file-archive';
        fileTypeClass = 'file-archive';
    } else if (['mp3', 'wav', 'ogg'].includes(fileExt)) {
        fileIcon = 'fa-file-audio';
        fileTypeClass = 'file-audio';
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExt)) {
        fileIcon = 'fa-file-video';
        fileTypeClass = 'file-video';
    } else if (['txt', 'rtf'].includes(fileExt)) {
        fileIcon = 'fa-file-alt';
        fileTypeClass = 'file-text';
    }
    
    // Show thumbnail for images if available
    let thumbnailHtml = '';
    if (fileTypeClass === 'file-image' && file.thumbnail_url) {
        thumbnailHtml = `<img src="${file.thumbnail_url}" alt="${file.name}" class="file-thumbnail">`;
    }
    
    fileElement.innerHTML = `
        <div class="file-icon ${fileTypeClass}">
            ${thumbnailHtml || `<i class="fas ${fileIcon}"></i>`}
        </div>
        <div class="file-details">
            <div class="file-name">${file.name}</div>
            <div class="file-meta">
                <span class="file-size">${formatFileSize(file.size)}</span>
                <span class="file-date">${formatDate(file.date_uploaded)}</span>
            </div>
        </div>
        <div class="file-actions">
            <button class="file-action download" title="Download" onclick="downloadFile('${file.id}')">
                <i class="fas fa-download"></i>
            </button>
            <button class="file-action share" title="Share" onclick="shareFile('${file.id}')">
                <i class="fas fa-share-alt"></i>
            </button>
            <button class="file-action delete" title="Delete" onclick="deleteFile('${file.id}')">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    return fileElement;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);
    
    // Less than a minute
    if (diffSec < 60) {
        return 'Just now';
    }
    // Less than an hour
    else if (diffMin < 60) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    }
    // Less than a day
    else if (diffHour < 24) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    }
    // Less than 7 days
    else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    // Regular date
    else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize user activity tracking for analytics
function initializeUserActivityTracker() {
    // Only track if the user has opted in
    if (localStorage.getItem('trackingConsent') !== 'true') {
        return;
    }
    
    let idleTime = 0;
    const idleInterval = setInterval(timerIncrement, 60000); // 1 minute
    
    // Reset idle time on user activity
    ['mousemove', 'keypress', 'click', 'touchstart'].forEach(eventType => {
        document.addEventListener(eventType, resetIdleTime);
    });
    
    function resetIdleTime() {
        idleTime = 0;
    }
    
    function timerIncrement() {
        idleTime++;
        
        // Record activity data after 10 minutes of inactivity
        if (idleTime >= 10) {
            recordUserActivity('idle');
            clearInterval(idleInterval);
        }
    }
    
    // Record page visit
    recordUserActivity('page_visit');
    
    // Record file interactions
    document.addEventListener('click', e => {
        const action = e.target.closest('.file-action');
        if (action) {
            const fileItem = action.closest('.file-item');
            if (fileItem) {
                const fileId = fileItem.getAttribute('data-file-id');
                const actionType = action.classList.contains('download') ? 'download' :
                                  action.classList.contains('share') ? 'share' :
                                  action.classList.contains('delete') ? 'delete' : 'other';
                
                recordUserActivity('file_action', {
                    fileId,
                    actionType
                });
            }
        }
    });
    
    // Record search actions
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', debounce(e => {
            if (e.target.value.length > 2) {
                recordUserActivity('search', {
                    term: e.target.value
                });
            }
        }, 1000));
    }
}

// Record user activity for analytics
function recordUserActivity(activityType, data = {}) {
    // Only send if user has opted in to analytics
    if (localStorage.getItem('trackingConsent') !== 'true') {
        return;
    }
    
    const activityData = {
        type: activityType,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        ...data
    };
    
    // Send to server
    fetch('/api/activity/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify(activityData)
    }).catch(error => {
        console.error('Error recording activity:', error);
    });
    
    // Also notify via WebSocket for real-time analytics
    if (window.secureShareWS) {
        window.secureShareWS.send({
            type: 'user_activity',
            activity: activityData
        });
    }
}

// Enhanced file sorting functionality
function setupFileSorting() {
    const sortOptions = document.getElementById('sort-options');
    if (!sortOptions) return;
    
    sortOptions.addEventListener('change', e => {
        const sortBy = e.target.value;
        sortFiles(sortBy);
    });
}

function sortFiles(sortBy) {
    const fileExplorer = document.getElementById('file-explorer');
    if (!fileExplorer) return;
    
    const files = Array.from(fileExplorer.querySelectorAll('.file-item'));
    
    // Sort files based on the selected option
    files.sort((a, b) => {
        switch(sortBy) {
            case 'name-asc':
                return a.getAttribute('data-file-name').localeCompare(b.getAttribute('data-file-name'));
            case 'name-desc':
                return b.getAttribute('data-file-name').localeCompare(a.getAttribute('data-file-name'));
            case 'date-asc':
                return new Date(a.getAttribute('data-file-date')) - new Date(b.getAttribute('data-file-date'));
            case 'date-desc':
                return new Date(b.getAttribute('data-file-date')) - new Date(a.getAttribute('data-file-date'));
            case 'size-asc':
                return parseInt(a.getAttribute('data-file-size')) - parseInt(b.getAttribute('data-file-size'));
            case 'size-desc':
                return parseInt(b.getAttribute('data-file-size')) - parseInt(a.getAttribute('data-file-size'));
            default:
                return 0;
        }
    });
    
    // Apply sorting with animation
    files.forEach(file => {
        fileExplorer.appendChild(file);
        // Add a subtle animation
        file.animate([
            { transform: 'translateY(10px)', opacity: 0.5 },
            { transform: 'translateY(0)', opacity: 1 }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
    });
}

// File filtering functionality
function setupFileFiltering() {
    const filterOptions = document.getElementById('filter-options');
    if (!filterOptions) return;
    
    filterOptions.addEventListener('change', e => {
        const filterBy = e.target.value;
        filterFiles(filterBy);
    });
}

function filterFiles(filterBy) {
    const fileItems = document.querySelectorAll('.file-item');
    
    fileItems.forEach(item => {
        const fileType = item.getAttribute('data-file-type');
        
        if (filterBy === 'all' || fileType.startsWith(filterBy)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Setup enhanced file interactions (context menu, keyboard shortcuts)
function setupFileInteractions() {
    const fileExplorer = document.getElementById('file-explorer');
    if (!fileExplorer) return;
    
    // Add right-click context menu to file items
    fileExplorer.addEventListener('contextmenu', e => {
        const fileItem = e.target.closest('.file-item');
        if (!fileItem) return;
        
        e.preventDefault();
        
        // Show custom context menu
        showFileContextMenu(fileItem, e.clientX, e.clientY);
    });
    
    // Add keyboard shortcuts for file operations
    document.addEventListener('keydown', e => {
        const activeFile = fileExplorer.querySelector('.file-item.active');
        if (!activeFile) return;
        
        const fileId = activeFile.getAttribute('data-file-id');
        
        // Keyboard shortcuts
        if (e.key === 'Delete') {
            e.preventDefault();
            deleteFile(fileId);
        } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            downloadFile(fileId);
        } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            shareFile(fileId);
        } else if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            renameFile(fileId);
        }
    });
}

// Show custom context menu for file items
function showFileContextMenu(fileItem, x, y) {
    // Remove any existing context menu
    const existingMenu = document.getElementById('file-context-menu');
    if (existingMenu) existingMenu.remove();
    
    // Get file info
    const fileId = fileItem.getAttribute('data-file-id');
    const fileName = fileItem.querySelector('.file-name').textContent;
    
    // Create context menu element
    const contextMenu = document.createElement('div');
    contextMenu.id = 'file-context-menu';
    contextMenu.className = 'context-menu';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    
    contextMenu.innerHTML = `
        <div class="context-menu-header">
            <span>${fileName}</span>
        </div>
        <ul class="context-menu-options">
            <li onclick="downloadFile('${fileId}'); hideContextMenu();">
                <i class="fas fa-download"></i> Download
            </li>
            <li onclick="shareFile('${fileId}'); hideContextMenu();">
                <i class="fas fa-share-alt"></i> Share
            </li>
            <li onclick="renameFile('${fileId}'); hideContextMenu();">
                <i class="fas fa-edit"></i> Rename
            </li>
            <li onclick="viewFileDetails('${fileId}'); hideContextMenu();">
                <i class="fas fa-info-circle"></i> Details
            </li>
            <li class="divider"></li>
            <li onclick="deleteFile('${fileId}'); hideContextMenu();" class="dangerous">
                <i class="fas fa-trash"></i> Delete
            </li>
        </ul>
    `;
    
    document.body.appendChild(contextMenu);
    
    // Ensure the menu stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuRect = contextMenu.getBoundingClientRect();
    
    if (menuRect.right > viewportWidth) {
        contextMenu.style.left = `${x - menuRect.width}px`;
    }
    
    if (menuRect.bottom > viewportHeight) {
        contextMenu.style.top = `${y - menuRect.height}px`;
    }
    
    // Handle click outside to close menu
    document.addEventListener('click', hideContextMenu);
    
    // Handle escape key to close menu
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') hideContextMenu();
    });
}

// Hide context menu
function hideContextMenu() {
    const contextMenu = document.getElementById('file-context-menu');
    if (contextMenu) {
        contextMenu.remove();
        document.removeEventListener('click', hideContextMenu);
    }
}

// Rename file function
function renameFile(fileId) {
    const fileItem = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
    if (!fileItem) return;
    
    const fileNameElement = fileItem.querySelector('.file-name');
    if (!fileNameElement) return;
    
    const currentName = fileNameElement.textContent;
    
    // Create an input field for renaming
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.className = 'rename-input';
    inputField.value = currentName;
    
    // Replace the file name with the input field
    fileNameElement.innerHTML = '';
    fileNameElement.appendChild(inputField);
    
    // Focus the input field and select all text
    inputField.focus();
    inputField.select();
    
    // Handle input field blur (click outside)
    inputField.addEventListener('blur', handleRename);
    
    // Handle enter key press
    inputField.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            // Cancel rename on escape
            fileNameElement.textContent = currentName;
        }
    });
    
    function handleRename() {
        const newName = inputField.value.trim();
        
        if (newName && newName !== currentName) {
            // In a real app, this would call an API to rename the file
            // For now, just update the UI
            fileNameElement.textContent = newName;
            
            // Show a toast notification
            displayNotification({
                type: 'file_renamed',
                message: `File "${currentName}" renamed to "${newName}"`,
                timestamp: new Date().toISOString()
            });
            
            // Track the event
            if (window.trackUserEvent) {
                window.trackUserEvent('file_rename', {
                    fileId: fileId,
                    oldName: currentName,
                    newName: newName
                });
            }
        } else {
            // If name is empty or unchanged, revert to original
            fileNameElement.textContent = currentName;
        }
    }
}

// View file details function
function viewFileDetails(fileId) {
    // In a real app, this would fetch detailed file information
    // For demonstration, we'll create a modal with some sample details
    
    const fileItem = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
    if (!fileItem) return;
    
    const fileName = fileItem.querySelector('.file-name').textContent;
    const fileSize = fileItem.querySelector('.file-size')?.textContent || 'Unknown';
    const fileDate = fileItem.querySelector('.file-date')?.textContent || 'Unknown';
    
    // Create modal for file details
    const modal = document.createElement('div');
    modal.id = 'file-details-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>File Details</h3>
                <button class="close-btn" onclick="closeModal('file-details-modal')">×</button>
            </div>
            <div class="modal-body">
                <div class="file-icon-large">
                    <i class="${fileItem.querySelector('.file-icon i').className}"></i>
                </div>
                
                <table class="details-table">
                    <tr>
                        <th>Name:</th>
                        <td>${fileName}</td>
                    </tr>
                    <tr>
                        <th>Size:</th>
                        <td>${fileSize}</td>
                    </tr>
                    <tr>
                        <th>Uploaded:</th>
                        <td>${fileDate}</td>
                    </tr>
                    <tr>
                        <th>Type:</th>
                        <td>${determineFileType(fileName)}</td>
                    </tr>
                    <tr>
                        <th>Access:</th>
                        <td>Private</td>
                    </tr>
                    <tr>
                        <th>Shared with:</th>
                        <td>
                            <div class="shared-users-preview">
                                <span>Loading...</span>
                            </div>
                        </td>
                    </tr>
                </table>
                
                <div class="file-activity">
                    <h4>Recent Activity</h4>
                    <ul class="activity-list">
                        <li>
                            <i class="fas fa-upload"></i>
                            <span>Uploaded on ${fileDate}</span>
                        </li>
                        <li>
                            <i class="fas fa-eye"></i>
                            <span>Last viewed just now</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('file-details-modal')">Close</button>
                <button class="btn btn-primary" onclick="downloadFile('${fileId}'); closeModal('file-details-modal');">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // In a real app, fetch shared users
    setTimeout(() => {
        const sharedUsersPreview = modal.querySelector('.shared-users-preview');
        if (sharedUsersPreview) {
            sharedUsersPreview.innerHTML = 'Not shared with anyone';
        }
    }, 500);
    
    // Track file view
    if (window.trackUserEvent) {
        window.trackUserEvent('file_view', {
            fileId: fileId,
            fileName: fileName
        });
    }
}

// Determine file type from name
function determineFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const fileTypes = {
        'pdf': 'PDF Document',
        'doc': 'Word Document',
        'docx': 'Word Document',
        'xls': 'Excel Spreadsheet',
        'xlsx': 'Excel Spreadsheet',
        'ppt': 'PowerPoint Presentation',
        'pptx': 'PowerPoint Presentation',
        'jpg': 'JPEG Image',
        'jpeg': 'JPEG Image',
        'png': 'PNG Image',
        'gif': 'GIF Image',
        'mp3': 'MP3 Audio',
        'mp4': 'MP4 Video',
        'zip': 'ZIP Archive',
        'rar': 'RAR Archive',
        'txt': 'Text Document',
        'html': 'HTML Document',
        'css': 'CSS File',
        'js': 'JavaScript File',
        'json': 'JSON File',
        'py': 'Python Script',
        'java': 'Java Source File',
        'c': 'C Source File',
        'cpp': 'C++ Source File',
        'cs': 'C# Source File'
    };
    
    return fileTypes[extension] || `${extension.toUpperCase()} File`;
}

// Initialize real-time features
function initializeRealTimeFeatures() {
    // This uses our enhanced websocket.js functionality
    if (window.secureShareWS) {
        // Register handlers for different real-time events
        window.secureShareWS.on('notification', data => {
            // Update notification counter in the UI
            updateNotificationCounter(parseInt(document.getElementById('notification-counter').textContent || '0') + 1);
        });
        
        window.secureShareWS.on('file_update', data => {
            // Refresh file list if the file was updated by someone else
            if (data.byCurrentUser !== true) {
                // Show toast notification about the update
                showToast(`File "${data.fileName}" was updated by ${data.by}`, 'info');
                
                // Refresh the file list to show the latest changes
                if (document.querySelector('#file-explorer')) {
                    refreshFileList();
                }
            }
        });
        
        // Track which files are visible to the user
        trackVisibleFiles();
    }
}

// Track which files are currently visible in the viewport
function trackVisibleFiles() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const fileItem = entry.target;
            const fileId = fileItem.getAttribute('data-file-id');
            
            if (fileId) {
                if (entry.isIntersecting) {
                    // File is visible in viewport, notify server
                    window.secureShareWS.startFileActivity(fileId, 'view');
                } else {
                    // File is no longer visible
                    window.secureShareWS.endFileActivity(fileId);
                }
            }
        });
    }, {
        root: null, // use viewport
        threshold: 0.5 // at least 50% visible
    });
    
    // Observe all file items
    document.querySelectorAll('.file-item').forEach(item => {
        observer.observe(item);
    });
}