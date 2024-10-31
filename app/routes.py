from flask import request, send_from_directory, render_template, redirect, url_for, flash, abort
from flask_login import login_user, current_user, logout_user, login_required
from app import app, db, cipher_suite, UPLOAD_FOLDER, DOWNLOAD_FOLDER
from app.models import User, File, Friend, FileShare
import os
import re

def validate_password(password):
    # Define password requirements
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one digit"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    return True, ""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Validate password
        is_valid, message = validate_password(password)
        if not is_valid:
            flash(message, 'danger')
            return redirect(url_for('register'))
        
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash('Your account has been created!', 'success')
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Login Unsuccessful. Please check email and password', 'danger')
    return render_template('login.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            return 'No file part', 400
        file = request.files['file']
        if file.filename == '':
            return 'No selected file', 400

        filename = os.path.basename(file.filename)
        user_folder = os.path.join(UPLOAD_FOLDER, str(current_user.id))
        os.makedirs(user_folder, exist_ok=True)
        safe_path = os.path.abspath(os.path.join(user_folder, filename))

        if not safe_path.startswith(os.path.abspath(user_folder)):
            return 'Invalid file path', 400

        file_data = file.read()
        encrypted_data = cipher_suite.encrypt(file_data)

        with open(safe_path, 'wb') as encrypted_file:
            encrypted_file.write(encrypted_data)

        new_file = File(filename=filename, user_id=current_user.id)
        db.session.add(new_file)
        db.session.commit()

        return 'File uploaded and encrypted successfully'
    return render_template('upload.html')

@app.route('/download', methods=['GET'])
@login_required
def download_page():
    return render_template('download.html')

@app.route('/decrypt', methods=['GET'])
@login_required
def decrypt_file():
    filename = request.args.get('filename')
    if not filename:
        return 'No filename provided', 400

    filename = os.path.basename(filename)
    user_folder = os.path.join(UPLOAD_FOLDER, str(current_user.id))
    encrypted_path = os.path.abspath(os.path.join(user_folder, filename))

    if not encrypted_path.startswith(os.path.abspath(user_folder)):
        return abort(404)

    if not os.path.exists(encrypted_path):
        return 'File not found', 404

    # Check if the current user is the owner of the file or if the file is shared with the current user
    file_record = File.query.filter_by(filename=filename, user_id=current_user.id).first()
    if not file_record:
        return 'File not found or you do not have permission to access this file', 404

    file_share = FileShare.query.filter_by(file_id=file_record.id, user_id=current_user.id).first()
    if not file_share:
        return 'Unauthorized access', 403

    with open(encrypted_path, 'rb') as encrypted_file:
        encrypted_data = encrypted_file.read()
        decrypted_data = cipher_suite.decrypt(encrypted_data)

    decrypted_path = os.path.abspath(os.path.join(DOWNLOAD_FOLDER, filename))
    with open(decrypted_path, 'wb') as decrypted_file:
        decrypted_file.write(decrypted_data)

    return send_from_directory(DOWNLOAD_FOLDER, filename)

@app.route('/friends', methods=['GET', 'POST'])
@login_required
def manage_friends():
    if request.method == 'POST':
        friend_username = request.form['friend_username']
        friend = User.query.filter_by(username=friend_username).first()
        if friend:
            new_friend = Friend(user_id=current_user.id, friend_id=friend.id)
            db.session.add(new_friend)
            db.session.commit()
            flash('Friend added successfully!', 'success')
        else:
            flash('User not found', 'danger')
    friends = Friend.query.filter_by(user_id=current_user.id).all()
    friend_list = [User.query.get(friend.friend_id) for friend in friends]
    return render_template('friends.html', friends=friend_list)

@app.route('/share', methods=['POST'])
@login_required
def share_file():
    filename = request.form['filename']
    friend_username = request.form['friend_username']
    friend = User.query.filter_by(username=friend_username).first()

    if not friend:
        flash('Friend not found', 'danger')
        return redirect(url_for('manage_friends'))

    file_record = File.query.filter_by(filename=filename, user_id=current_user.id).first()
    if not file_record:
        flash('File not found or you do not have permission to share this file', 'danger')
        return redirect(url_for('manage_friends'))

    file_share = FileShare(file_id=file_record.id, user_id=friend.id)
    db.session.add(file_share)
    db.session.commit()

    flash('File shared successfully!', 'success')
    return redirect(url_for('manage_friends'))