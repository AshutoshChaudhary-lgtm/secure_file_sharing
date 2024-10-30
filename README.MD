# Simple File Sharing Project

This project is a simple file sharing system that allows users to upload files, which are then encrypted, and download files, which are decrypted.

## Features

- User registration and login.
- Upload files and encrypt them on the server.
- Download files and decrypt them on the server.
- Manage friends list.
- Simple web interface for uploading and downloading files.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/simple-file-sharing-project.git
    cd simple-file-sharing-project
    ```

2. Create a virtual environment and activate it:
    ```sh
    python3 -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the dependencies:
    ```sh
    pip install -r requirements.txt
    ```

4. Create a `.env` file in the root directory and add your secret key:
    ```
    SECRET_KEY=your_secret_key
    ```

5. Run the application:
    ```sh
    python run.py
    ```

6. Open your web browser and navigate to `http://<raspberry_pi_ip>:5000/`.

## Directory Structure
secure-file-sharing/
├── app/
├── init.py
├── models.py
├── routes.py
├── templates/
│   ├── index.html
│   ├── upload.html
│   ├── download.html
│   ├── login.html
│   ├── register.html
│   └── friends.html
├── uploads/
├── downloads/
├── migrations/
├── key.key
├── requirements.txt
├── README.md
├── run.py
└── .env

## Notes

- Ensure that the `uploads` and `downloads` directories have the correct permissions.
- The encryption key is stored in `key.key`. Keep this file secure.