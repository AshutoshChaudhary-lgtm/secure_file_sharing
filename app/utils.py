import os
from cryptography.fernet import Fernet
from django.conf import settings
import base64

def get_encryption_key():
    """Load the encryption key from key.key file"""
    key_file_path = os.path.join(settings.BASE_DIR, 'key.key')
    
    try:
        with open(key_file_path, 'rb') as key_file:
            key = key_file.read().strip()
            # Convert base64 key from file to bytes if needed
            if isinstance(key, str):
                key = key.encode('utf-8')
            return base64.urlsafe_b64encode(base64.urlsafe_b64decode(key))
    except Exception as e:
        print(f"Error loading encryption key: {str(e)}")
        # Generate a new key if the key file doesn't exist or is invalid
        key = Fernet.generate_key()
        with open(key_file_path, 'wb') as key_file:
            key_file.write(key)
        return key

def encrypt_file(input_file_path, output_file_path):
    """
    Encrypt a file using Fernet symmetric encryption
    
    Args:
        input_file_path: Path to the original file
        output_file_path: Path where the encrypted file will be saved
    
    Returns:
        bool: True if encryption was successful, False otherwise
    """
    try:
        key = get_encryption_key()
        cipher = Fernet(key)
        
        # Read the original file data
        with open(input_file_path, 'rb') as file:
            file_data = file.read()
        
        # Encrypt the data
        encrypted_data = cipher.encrypt(file_data)
        
        # Write the encrypted data to the output file
        with open(output_file_path, 'wb') as file:
            file.write(encrypted_data)
            
        return True
    except Exception as e:
        print(f"Encryption error: {str(e)}")
        return False

def decrypt_file(input_file_path, output_file_path):
    """
    Decrypt a file encrypted with Fernet symmetric encryption
    
    Args:
        input_file_path: Path to the encrypted file
        output_file_path: Path where the decrypted file will be saved
    
    Returns:
        bool: True if decryption was successful, False otherwise
    """
    try:
        key = get_encryption_key()
        cipher = Fernet(key)
        
        # Read the encrypted file data
        with open(input_file_path, 'rb') as file:
            encrypted_data = file.read()
        
        # Decrypt the data
        decrypted_data = cipher.decrypt(encrypted_data)
        
        # Write the decrypted data to the output file
        with open(output_file_path, 'wb') as file:
            file.write(decrypted_data)
            
        return True
    except Exception as e:
        print(f"Decryption error: {str(e)}")
        return False

def get_user_upload_path(instance, filename):
    """
    Generate a user-specific path for file uploads
    
    Args:
        instance: The File model instance
        filename: Original filename
    
    Returns:
        str: Path where the file should be saved
    """
    # Get the username (or user ID if username has special characters)
    username = instance.user.username
    safe_username = ''.join(c for c in username if c.isalnum() or c in '-_')
    
    # Return the path: uploads/username/filename
    return os.path.join('uploads', safe_username, filename)