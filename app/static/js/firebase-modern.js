// Modern Firebase SDK implementation
// Import Firebase modules through CDN script tags in your HTML templates

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase with your config
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

    // Check if Firebase is loaded via module or global
    if (typeof firebase !== 'undefined') {
        console.log('Using global Firebase instance');
    } else if (typeof window.initializeApp !== 'undefined') {
        // Initialize Firebase with the new SDK
        const app = window.initializeApp(firebaseConfig);
        const analytics = window.getAnalytics(app);
        console.log('Firebase initialized with modern SDK');
    } else {
        console.error('Firebase SDK not loaded');
    }

    // Setup auth state listener
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(handleAuthStateChanged);
    } else if (typeof window.getAuth !== 'undefined') {
        const auth = window.getAuth();
        window.onAuthStateChanged(auth, handleAuthStateChanged);
    }
});

function handleAuthStateChanged(user) {
    if (user) {
        console.log('User is signed in:', user.uid);
        setupRealtimeListeners(user);
        document.dispatchEvent(new CustomEvent('userSignedIn', { detail: { userId: user.uid } }));
    } else {
        console.log('User is signed out');
        document.dispatchEvent(new CustomEvent('userSignedOut'));
    }
}

// This function is compatible with both Firebase SDK implementations
function setupRealtimeListeners(user) {
    if (!user) return;
    
    console.log('Setting up real-time listeners for user:', user.uid);
    
    // If using the modern SDK, create database references differently
    if (typeof firebase !== 'undefined' && firebase.database) {
        setupLegacyListeners(user);
    } else if (typeof window.getDatabase !== 'undefined') {
        setupModernListeners(user);
    }
}

function setupLegacyListeners(user) {
    // Legacy implementation using firebase global object
    // This code is already in your firebase-init.js
    // It handles setting up listeners using the Compat version
}

function setupModernListeners(user) {
    // Modern implementation using module imports
    const db = window.getDatabase();
    
    // Listen for files shared with the current user
    const sharedFilesRef = window.ref(db, `users/${user.uid}/shared_with_me`);
    
    window.onChildAdded(sharedFilesRef, (snapshot) => {
        const fileId = snapshot.key;
        // Get file details
        const fileRef = window.ref(db, `files/${fileId}`);
        window.get(fileRef).then((fileSnapshot) => {
            if (fileSnapshot.exists()) {
                const fileData = fileSnapshot.val();
                displayNotification({
                    type: 'file_shared',
                    message: `File "${fileData.file_name}" has been shared with you.`,
                    timestamp: new Date().toISOString()
                });
            }
        });
    });
    
    // Listen for comments on files owned by the current user
    const filesRef = window.ref(db, 'files');
    const fileQuery = window.query(filesRef, window.orderByChild('owner_id'), window.equalTo(user.uid));
    
    window.onChildChanged(fileQuery, (snapshot) => {
        const fileData = snapshot.val();
        
        // Check if the change was a comment
        if (fileData && fileData.comments) {
            const commentsKeys = Object.keys(fileData.comments);
            const lastCommentKey = commentsKeys[commentsKeys.length - 1];
            const lastComment = fileData.comments[lastCommentKey];
            
            // Only show notification if the comment was not added by the current user
            if (lastComment.user_id !== user.uid) {
                displayNotification({
                    type: 'comment_added',
                    message: `New comment on your file "${fileData.file_name}".`,
                    timestamp: new Date().toISOString()
                });
            }
        }
    });
}