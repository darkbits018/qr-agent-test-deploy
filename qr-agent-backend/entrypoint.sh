#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run database migrations
flask db upgrade

# Start the Gunicorn server
exec gunicorn --worker-class gevent --workers 3 --bind 0.0.0.0:8001 "app:create_app()"
