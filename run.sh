#!/bin/bash

# Create and activate virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Initialize the database
python manage.py makemigrations app
python manage.py migrate

# Run the Django development server on all interfaces
python manage.py runserver 0.0.0.0:8000