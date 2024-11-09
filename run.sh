#!/bin/bash

# Create the virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3.11 -m venv venv
fi

# Activate the virtual environment
source venv/bin/activate

# Upgrade pip using the virtual environment's pip
venv/bin/pip install --upgrade pip

# Install dependencies using the virtual environment's pip
venv/bin/pip install -r requirements.txt

# Initialize the database using the virtual environment's Python
venv/bin/python manage.py makemigrations app
venv/bin/python manage.py migrate

# Run the Django development server using the virtual environment's Python
venv/bin/python manage.py runserver 0.0.0.0:8000