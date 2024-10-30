from flask import Flask
from cryptography.fernet import Fernet
import os

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
DOWNLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')
KEY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'key.key')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

if not os.path.exists(KEY_FILE):
    key = Fernet.generate_key()
    with open(KEY_FILE, 'wb') as key_file:
        key_file.write(key)
else:
    with open(KEY_FILE, 'rb') as key_file:
        key = key_file.read()

cipher_suite = Fernet(key)

from app import routes