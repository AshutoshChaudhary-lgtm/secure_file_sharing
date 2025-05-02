@echo off
echo Starting secure file sharing application setup...

REM Check if Python 3.13 is available
python --version 2>nul | find "3.13" >nul
if errorlevel 1 (
    echo Error: Python 3.13 is required but not found.
    echo Please install Python 3.13 and try again.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo Virtual environment created.
)

REM Activate the virtual environment
echo Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo Failed to activate virtual environment.
    pause
    exit /b 1
)
echo Virtual environment activated.

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip
if errorlevel 1 (
    echo Failed to upgrade pip.
    echo Continuing anyway as this is not critical...
)
echo Pip upgraded.

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo Failed to install dependencies.
    echo Check if the requirements.txt file is valid and try again.
    pause
    exit /b 1
)
echo Dependencies installed.

REM Make migrations
echo Running makemigrations...
python manage.py makemigrations app
if errorlevel 1 (
    echo Failed to make migrations.
    pause
    exit /b 1
)
echo Migrations created.

REM Apply migrations
echo Applying migrations...
python manage.py migrate
if errorlevel 1 (
    echo Failed to apply migrations.
    pause
    exit /b 1
)
echo Migrations applied.

REM Start the server
echo Starting Django development server...
python manage.py runserver 127.0.0.1:8000

REM If we get here, the server was stopped
echo Server stopped.
pause