from flask import Flask, request, send_from_directory
import os

app = Flask(__name__)
UPLOAD_FOLDER = '/path/to/upload'
DOWNLOAD_FOLDER = '/path/to/download'

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    file.save(os.path.join(UPLOAD_FOLDER, file.filename))
    return 'File uploaded successfully'

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(DOWNLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)