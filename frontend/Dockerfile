# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage - serve with nginx
FROM nginx:trixie

# Set default backend URL
ENV BACKEND_URL=http://192.168.10.98:5000

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Substitute environment variables in nginx config
RUN echo "substituting env vars..." && \
    envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.new && \
    mv /etc/nginx/conf.d/default.conf.new /etc/nginx/conf.d/default.conf

RUN mkdir /opt/certs

RUN openssl req -x509 -new -newkey rsa:2048 -nodes -keyout /opt/certs/pqc.key -out /opt/certs/pqc.crt -days 365 -subj "/C=PT/ST=Some-State/L=PN/O=IST/CN=nokia.ist.utl.pt"
# RUN openssl req -x509 -new -newkey mldsa65 -nodes -keyout /opt/certs/pqc.key -out /opt/certs/pqc.crt -days 365 -subj "/C=PT/ST=Some-State/L=PN/O=IST/CN=nokia.ist.utl.pt"

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
