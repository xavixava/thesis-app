#!/bin/bash

# Start Gunicorn in the background (&)
gunicorn --bind 127.0.0.1:5000 --workers 4 app:app &

# Start Nginx in the foreground
nginx -g "daemon off;"
