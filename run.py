#!/usr/bin/env python
import os
import django

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'secure_file_sharing.settings')
    django.setup()
    from django.core.management import execute_from_command_line
    execute_from_command_line(['manage.py', 'runserver'])