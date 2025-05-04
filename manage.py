#!/usr/bin/env python
import os
import sys

# Check Python version - enforce Python 3.11 only
if not (3, 11, 0) <= sys.version_info < (3, 12, 0):
    print("Error: This project requires Python 3.11.")
    print(f"You are using Python {sys.version.split()[0]}.")
    print("Please use Python 3.11 to run this project.")
    sys.exit(1)

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()