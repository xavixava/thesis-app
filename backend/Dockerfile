FROM python:3.12-slim-trixie

# Install Nginx and Supervisor
RUN apt-get update && apt-get install -y \
    nginx

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir gunicorn -r requirements.txt

# Copy application and configurations
COPY . .
COPY nginx.conf /etc/nginx/sites-available/default

# Ensure certs directory exists (mapping or copying your RSA/PQC certs)
RUN mkdir -p /opt/certs

RUN openssl req -x509 -new -newkey rsa:2048 -nodes -keyout /opt/certs/pqc.key -out /opt/certs/pqc.crt -days 365 -subj "/C=PT/ST=Some-State/L=PN/O=IST/CN=nokia.ist.utl.pt"

EXPOSE 80 5443

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Use the script as the starting command
CMD ["/bin/bash", "/entrypoint.sh"]
