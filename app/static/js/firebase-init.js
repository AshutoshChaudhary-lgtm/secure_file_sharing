// Firebase initialization script
document.addEventListener('DOMContentLoaded', function() {
    // Your Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDeBcZ-Atp_aapEBezXxzS4uW6zwyfPgQk",
        authDomain: "file-sha.firebaseapp.com",
        databaseURL: "https://file-sha-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "file-sha",
        storageBucket: "file-sha.firebasestorage.app",
        messagingSenderId: "260985249619",
        appId: "1:260985249619:web:6a64de62eb748c21d80ba6",
        measurementId: "G-R3YLCMJ97M"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Setup real-time listeners for notifications
    if (firebase.auth().currentUser) {
        setupRealtimeListeners();
    }

    // Authentication state change
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log('User is signed in:', user.uid);
            setupRealtimeListeners();
        } else {
            console.log('User is signed out');
        }
    });
});

function setupRealtimeListeners() {
    const currentUser = firebase.auth().currentUser;
    
    if (!currentUser) return;

    // Listen for files shared with the current user
    const sharedFilesRef = firebase.database().ref('users/' + currentUser.uid + '/shared_with_me');
    
    sharedFilesRef.on('child_added', function(data) {
        const fileId = data.key;
        // Fetch the file details
        firebase.database().ref('files/' + fileId).once('value', function(snapshot) {
            const fileData = snapshot.val();
            if (fileData) {
                displayNotification({
                    type: 'file_shared',
                    message: `File "${fileData.file_name}" has been shared with you.`,
                    timestamp: new Date().toISOString()
                });
            }
        });
    });

    // Listen for comments on files owned by the current user
    const filesRef = firebase.database().ref('files');
    filesRef.orderByChild('owner_id').equalTo(currentUser.uid).on('child_changed', function(snapshot) {
        const fileData = snapshot.val();
        
        // Check if the change was a comment
        if (fileData && fileData.comments) {
            const commentsKeys = Object.keys(fileData.comments);
            const lastCommentKey = commentsKeys[commentsKeys.length - 1];
            const lastComment = fileData.comments[lastCommentKey];
            
            // Only show notification if the comment was not added by the current user
            if (lastComment.user_id !== currentUser.uid) {
                displayNotification({
                    type: 'comment_added',
                    message: `New comment on your file "${fileData.file_name}".`,
                    timestamp: new Date().toISOString()
                });
            }
        }
    });
}