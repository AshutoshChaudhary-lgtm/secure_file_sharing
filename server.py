from flask import Flask, request, send_from_directory, safe_join, abort
import os

app = Flask(__name__)
UPLOAD_FOLDER = '/path/to/upload'
DOWNLOAD_FOLDER = '/path/to/download'

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part', 400
    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400

    filename = os.path.basename(file.filename)
    safe_path = safe_join(UPLOAD_FOLDER, filename)

    if not safe_path.startswith(os.path.abspath(UPLOAD_FOLDER)):
        return 'Invalid file path', 400

    file.save(safe_path)
    return 'File uploaded successfully'

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    safe_path = safe_join(DOWNLOAD_FOLDER, filename)

    if not safe_path.startswith(os.path.abspath(DOWNLOAD_FOLDER)):
        return abort(404)

    return send_from_directory(DOWNLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
