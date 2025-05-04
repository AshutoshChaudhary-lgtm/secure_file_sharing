# Secure File Sharing System

This project is a secure file sharing application that implements WebSockets for real-time notifications. Users receive instant notifications when files are shared with them, enhancing the interactivity of the application. Firebase integration provides additional functionality for notifications and user management.

## Tech Stack
- Python 3.11
- Django
- Django Channels for WebSocket support
- Firebase for real-time notifications and authentication
- Bootstrap for responsive UI
- Cryptography for secure file handling

## Features
- Real-time notifications via WebSockets
- User registration and authentication
- Secure file encryption/decryption
- Friend management system
- Selective file sharing with friends
- Responsive web interface
- Firebase integration for additional security

## Project Structure
```
secure_file_sharing_new/
├── app/                    # Main application code
│   ├── static/             # Static files (CSS, JS)
│   └── templates/          # HTML templates
├── config/                 # Project configuration
├── firebase_integration/   # Firebase services
├── media/                  # Uploaded files storage
│   └── uploads/            # User uploaded files
├── temp_file_flow/         # Frontend components
│   ├── public/
│   └── src/
├── manage.py               # Django management script
└── requirements.txt        # Project dependencies
```

## Installation

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)
- Firebase account and credentials

### Setup
1. Clone the repository:
   ```
   git clone <repository-url>
   cd secure_file_sharing_new
   ```

2. Create and activate a virtual environment (recommended):
   ```
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Configure Firebase:
   - Place your Firebase credentials in `firebase-credentials.json`

5. Set up the database:
   ```
   python manage.py migrate
   ```

6. Create an admin user (optional):
   ```
   python manage.py createsuperuser
   ```

## Running the Application

Start the development server:
```
python manage.py runserver
```

Access the application in your web browser at `http://127.0.0.1:8000/`

## Security Notes
- The encryption key is stored in `key.key`. Keep this file secure and back it up safely.
- For production deployment, set `DEBUG=False` in `config/settings.py`
- Consider implementing additional security measures like rate limiting and two-factor authentication
- Regularly update dependencies to address potential security vulnerabilities

## Additional Commands
- Make database migrations: `python manage.py makemigrations`
- Run tests: `python manage.py test`
- Collect static files: `python manage.py collectstatic`