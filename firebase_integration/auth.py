from firebase_admin import auth, initialize_app, credentials, get_app
import pyrebase
import os
import json

# Get the directory where auth.py is located
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the project root directory (parent of current directory)
project_root = os.path.dirname(current_dir)
# Path to the credentials file
creds_path = os.path.join(project_root, 'firebase-credentials.json')

print(f"Looking for Firebase credentials at: {creds_path}")

# Firebase Admin SDK initialization for server-side operations
try:
    cred = credentials.Certificate(creds_path)
    
    # Load project information from credentials file for client config
    with open(creds_path, 'r') as f:
        firebase_creds = json.load(f)
        project_id = firebase_creds.get('project_id')
        print(f"Found project_id: {project_id}")

    # Check if the default app already exists, if not, initialize it
    try:
        default_app = get_app()
        print("Using existing Firebase app")
    except ValueError:
        default_app = initialize_app(cred)
        print("Initialized new Firebase app")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")
    project_id = None

# Firebase configuration for client-side authentication
# Using the provided Firebase configuration
firebase_config = {
    "apiKey": "AIzaSyDeBcZ-Atp_aapEBezXxzS4uW6zwyfPgQk",
    "authDomain": "file-sha.firebaseapp.com",
    "databaseURL": "https://file-sha-default-rtdb.asia-southeast1.firebasedatabase.app",
    "projectId": "file-sha",
    "storageBucket": "file-sha.firebasestorage.app",
    "messagingSenderId": "260985249619",
    "appId": "1:260985249619:web:6a64de62eb748c21d80ba6",
    "measurementId": "G-R3YLCMJ97M"
}

# Print current configuration (for debugging)
print("Firebase Configuration:")
print({k: (v if k != 'apiKey' else '***') for k, v in firebase_config.items()})

# Initialize Firebase for client-side operations
try:
    firebase = pyrebase.initialize_app(firebase_config)
    firebase_auth = firebase.auth()

    # Only initialize database if databaseURL is provided
    if firebase_config["databaseURL"]:
        firebase_db = firebase.database()
    else:
        firebase_db = None

    # Only initialize storage if storageBucket is provided
    if firebase_config["storageBucket"]:
        firebase_storage = firebase.storage()
    else:
        firebase_storage = None
except Exception as e:
    print(f"Error initializing Firebase client SDK: {e}")
    firebase = None
    firebase_auth = None
    firebase_db = None
    firebase_storage = None

class FirebaseAuthService:
    @staticmethod
    def sign_up(email, password):
        """
        Register a new user with email and password
        """
        if not firebase_auth:
            print("Firebase auth not initialized properly")
            return None
            
        try:
            user = firebase_auth.create_user_with_email_and_password(email, password)
            return user
        except Exception as e:
            print(f"Error signing up: {e}")
            return None

    @staticmethod
    def sign_in(email, password):
        """
        Sign in a user with email and password
        """
        if not firebase_auth:
            print("Firebase auth not initialized properly")
            return None
            
        try:
            user = firebase_auth.sign_in_with_email_and_password(email, password)
            return user
        except Exception as e:
            print(f"Error signing in: {e}")
            return None

    @staticmethod
    def get_account_info(id_token):
        """
        Get user account information
        """
        if not firebase_auth:
            print("Firebase auth not initialized properly")
            return None
            
        try:
            user_info = firebase_auth.get_account_info(id_token)
            return user_info
        except Exception as e:
            print(f"Error getting account info: {e}")
            return None

    @staticmethod
    def verify_id_token(id_token):
        """
        Verify a Firebase ID token
        """
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            print(f"Error verifying token: {e}")
            return None

    @staticmethod
    def sign_out(id_token):
        """
        Sign out a user
        """
        try:
            # While pyrebase4 doesn't have a direct sign_out method,
            # on the client side, we can remove the token
            # This method is for future compatibility
            return True
        except Exception as e:
            print(f"Error signing out: {e}")
            return False
            
    @staticmethod
    def create_custom_token(uid, additional_claims=None):
        """
        Create a custom token for a user - useful for server-side authentication
        """
        try:
            custom_token = auth.create_custom_token(uid, additional_claims)
            return custom_token
        except Exception as e:
            print(f"Error creating custom token: {e}")
            return None