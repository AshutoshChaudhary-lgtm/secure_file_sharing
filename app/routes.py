from flask import request, send_from_directory, render_template, redirect, url_for, abort
from app import app, cipher_suite, UPLOAD_FOLDER, DOWNLOAD_FOLDER
import os

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            return 'No file part', 400
        file = request.files['file']
        if file.filename == '':
            return 'No selected file', 400

        filename = os.path.basename(file.filename)
        safe_path = os.path.abspath(os.path.join(UPLOAD_FOLDER, filename))

        if not safe_path.startswith(os.path.abspath(UPLOAD_FOLDER)):
            return 'Invalid file path', 400

        file_data = file.read()
        encrypted_data = cipher_suite.encrypt(file_data)

        with open(safe_path, 'wb') as encrypted_file:
            encrypted_file.write(encrypted_data)

        return 'File uploaded and encrypted successfully'
    return render_template('upload.html')

@app.route('/download', methods=['GET'])
def download_page():
    return render_template('download.html')

@app.route('/decrypt', methods=['GET'])
def decrypt_file():
    filename = request.args.get('filename')
    if not filename:
        return 'No filename provided', 400

    filename = os.path.basename(filename)
    encrypted_path = os.path.abspath(os.path.join(UPLOAD_FOLDER, filename))

    if not encrypted_path.startswith(os.path.abspath(UPLOAD_FOLDER)):
        return abort(404)

    if not os.path.exists(encrypted_path):
        return 'File not found', 404

    with open(encrypted_path, 'rb') as encrypted_file:
        encrypted_data = encrypted_file.read()
        decrypted_data = cipher_suite.decrypt(encrypted_data)

    decrypted_path = os.path.abspath(os.path.join(DOWNLOAD_FOLDER, filename))
    with open(decrypted_path, 'wb') as decrypted_file:
        decrypted_file.write(decrypted_data)

    return send_from_directory(DOWNLOAD_FOLDER, filename)