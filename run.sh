#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Function to print error messages
error_exit() {
    echo "$1" 1>&2
    exit 1
}

# Create the virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3.12 -m venv venv || error_exit "Failed to create virtual environment."
    echo "Virtual environment created."
fi

# Activate the virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "Virtual environment activated."
else
    error_exit "Virtual environment activation script not found."
fi

# Upgrade pip using the virtual environment's pip
venv/bin/pip install --upgrade pip || error_exit "Failed to upgrade pip."
echo "pip upgraded."

# Install dependencies using the virtual environment's pip
venv/bin/pip install -r requirements.txt || error_exit "Failed to install dependencies."
echo "Dependencies installed."

# Initialize the database using the virtual environment's Python
venv/bin/python manage.py makemigrations app || error_exit "makemigrations failed."
echo "makemigrations completed."

venv/bin/python manage.py migrate || error_exit "migrate failed."
echo "migrate completed."

# Run the Django development server using the virtual environment's Python
venv/bin/python manage.py runserver 0.0.0.0:8000