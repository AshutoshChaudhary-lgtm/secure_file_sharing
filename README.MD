# Secure File Sharing Project
This project is a Django-based secure file sharing system that allows users to upload files, which are then encrypted, and download files, which are decrypted.

## Tech Stack (Updated May 2025)
- Python 3.13
- Django 5.3.2
- Django REST Framework 3.15.0
- Bootstrap 5.5.1
- Cryptography 42.0.3

## Features
- User registration and login with secure password handling
- Encrypted file upload and storage
- Decrypted file download for authorized users
- Friend management system
- File sharing with friends
- Web interface with responsive design

## Installation
1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/secure-file-sharing.git
    cd secure-file-sharing
    ```

2. Create a virtual environment with Python 3.13 and activate it:
    ```sh
    python3.13 -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the dependencies:
    ```sh
    pip install -r requirements.txt
    ```

4. Run the application:
    ```sh
    # On Linux/macOS
    bash run.sh
    
    # On Windows
    python manage.py runserver
    ```

5. Open your web browser and navigate to `http://localhost:8000/`.

### Directory Structure
    secure-file-sharing/
    │
    ├── app/                    
    │   ├── __init__.py
    │   ├── apps.py
    │   ├── forms.py
    │   ├── models.py
    │   ├── views.py
    │   ├── templates/
    │   │   ├── base.html
    │   │   ├── delete_confirm.html
    │   │   ├── download.html
    │   │   ├── friends.html
    │   │   ├── index.html
    │   │   ├── login.html
    │   │   ├── register.html
    │   │   ├── upload.html
    │
    ├── secure_file_sharing/
    │   ├── __init__.py
    │   ├── asgi.py
    │   ├── settings.py
    │   ├── urls.py
    │   ├── wsgi.py
    │
    ├── static/
    │   ├── css/
    │   ├── js/
    │
    ├── media/         # Created dynamically for file storage
    ├── key.key        # Generated on first run
    ├── requirements.txt
    ├── README.md
    ├── manage.py
    ├── run.sh
    ├── .env

## Security Notes
- Ensure that the `media` directory has the correct permissions.
- The encryption key is stored in `key.key`. Keep this file secure and backup safely.
- In production, make sure to set DEBUG=False in settings.py and update SECRET_KEY.
- Consider implementing additional security measures like rate limiting and two-factor authentication for a production deployment.