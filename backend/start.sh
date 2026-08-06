#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating initial admin if needed..."
python manage.py create_initial_admin

echo "Starting server..."
exec gunicorn actserv_backend.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120
