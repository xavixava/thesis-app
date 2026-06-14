# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/. .
RUN npm run build

FROM python:3.12-slim-trixie

# Install Nginx and Supervisor
RUN apt-get update && apt-get install -y \
    nginx \
    snmp \
    libsnmp-dev \
    build-essential

WORKDIR /backend

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir gunicorn -r requirements.txt

# Copy application and configurations
COPY ./backend .
# COPY nginx.conf /etc/nginx/sites-available/default

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ensure certs directory exists (mapping or copying your RSA/PQC certs)
RUN mkdir -p /opt/certs

RUN openssl req -x509 -new -newkey rsa:2048 -nodes -keyout /opt/certs/pqc.key -out /opt/certs/pqc.crt -days 365 -subj "/C=PT/ST=Some-State/L=PN/O=IST/CN=nokia.ist.utl.pt"

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
EXPOSE 443

# Use the script as the starting command
CMD ["/bin/bash", "/entrypoint.sh"]


# Production stage - serve with nginx
# FROM nginx:trixie
# 
# # Set default backend URL
# ENV BACKEND_URL=http://192.168.10.98:5000
# 
# COPY --from=builder /app/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# 
# # Substitute environment variables in nginx config
# RUN echo "substituting env vars..." && \
#     envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.new && \
#     mv /etc/nginx/conf.d/default.conf.new /etc/nginx/conf.d/default.conf
# 
# EXPOSE 8080
# EXPOSE 8443
# 
# CMD ["nginx", "-g", "daemon off;"]
