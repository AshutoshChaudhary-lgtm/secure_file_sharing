@echo off
echo ==================================
echo Secure File Sharing - Development Server
echo ==================================

echo.
echo [1/5] Checking for Python 3.11...

REM Try different ways to find Python 3.11
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py -3.11 --version >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        set PYTHON_CMD=py -3.11
        goto :found_python
    )
)

where python3.11 >nul 2>nul 
if %ERRORLEVEL% EQU 0 (
    set PYTHON_CMD=python3.11
    goto :found_python
)

where python311 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set PYTHON_CMD=python311
    goto :found_python
) 

REM Python 3.11 not found, show error and exit
echo ERROR: Python 3.11 not found in PATH.
echo Please make sure Python 3.11 is installed and added to your PATH.
echo You can download it from: https://www.python.org/downloads/release/python-3118/
echo.
echo Currently using Python version:
python --version
exit /b 1

:found_python
echo Using: %PYTHON_CMD%
%PYTHON_CMD% --version

echo.
echo [2/5] Checking for virtual environment...
if exist venv311\Scripts\activate.bat (
    echo Activating virtual environment...
    call venv311\Scripts\activate.bat
) else (
    echo Creating Python 3.11 virtual environment...
    %PYTHON_CMD% -m venv venv311
    call venv311\Scripts\activate.bat
)

echo.
echo [3/5] Installing dependencies from requirements.txt...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    exit /b 1
)

echo.
echo [4/5] Running migrations...
python manage.py migrate

echo.
echo [5/5] Starting development server...
echo.
echo Access the website at http://localhost:8000/
echo Press CTRL+C to stop the server
echo.
python manage.py runserver 0.0.0.0:8000

pause
