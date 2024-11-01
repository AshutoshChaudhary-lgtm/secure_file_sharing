# run.sh
#!/bin/bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate
# Install dependencies
pip install -r requirements.txt
# Initialize the database
python manage.py makemigrations
python manage.py migrate
# Run the Django development server on all interfaces
python manage.py runserver 0.0.0.0:8000