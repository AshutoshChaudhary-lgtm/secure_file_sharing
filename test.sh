#!/bin/bash

echo "=================================="
echo "Secure File Sharing - Development Server"
echo "=================================="

echo -e "\n[1/5] Checking for Python 3.11..."
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
elif command -v python3 &> /dev/null; then
    # Check if python3 is version 3.11
    version=$(python3 --version 2>&1 | grep -o "3\.11\.")
    if [[ $version == "3.11." ]]; then
        PYTHON_CMD="python3"
    else
        echo "ERROR: Python 3.11 not found."
        echo "Please install Python 3.11 with your package manager:"
        echo "  - Ubuntu/Debian: sudo apt install python3.11"
        echo "  - Fedora: sudo dnf install python3.11"
        echo "  - Arch: sudo pacman -S python"
        exit 1
    fi
else
    echo "ERROR: Python 3 not found"
    exit 1
fi

echo "Using: $PYTHON_CMD"
$PYTHON_CMD --version

echo -e "\n[2/5] Checking for virtual environment..."
if [ -f "venv311/bin/activate" ]; then
    echo "Activating virtual environment..."
    source venv311/bin/activate
else
    echo "Creating Python 3.11 virtual environment..."
    $PYTHON_CMD -m venv venv311
    source venv311/bin/activate
fi

echo -e "\n[3/5] Installing dependencies from requirements.txt..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo -e "\n[4/5] Running migrations..."
python manage.py migrate

echo -e "\n[5/5] Starting development server..."
echo 
echo "Access the website at http://localhost:8000/"
echo "Press CTRL+C to stop the server"
echo
python manage.py runserver 0.0.0.0:8000
