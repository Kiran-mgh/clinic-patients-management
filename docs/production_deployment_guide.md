# Production Deployment Guide - Amar Hospital

This guide describes how to deploy the **Amar Hospital Healthcare Management Platform** in a production environment using Docker Compose and Nginx as a reverse proxy with Let's Encrypt SSL.

---

## 1. Prerequisites

The target virtual machine (Ubuntu 22.04 LTS or similar) must have the following installed:
* Docker (v20.10+)
* Docker Compose (v2.0+)
* Git
---

## 2. Environment Configurations

Create a `.env` file in the root of the project directory. Docker Compose will automatically read this file to populate database credentials and container configurations.

### Unified Environment File (`.env`)
```ini
# Production Environment
NODE_ENV=production

# Database Credentials
DB_USERNAME=amar_admin
DB_PASSWORD=SecurePasswordChangeMe! # Replace with a strong password
DB_DATABASE=amar_hospital

# NestJS API Authentication
JWT_SECRET=super_secret_jwt_sign_key_change_in_production # Replace with a secure random key
JWT_EXPIRATION=90d

# Portal Gateway Configuration
VITE_API_URL=https://api.amarhospital.com/api

# Authorized Staff Whitelist (comma-separated 10-digit or E.164 mobile numbers)
AUTHORIZED_DOCTORS=9876543210,9876543211
```

---

## 3. Deployment Steps

### Step A: Clone and Prepare
```bash
git clone https://github.com/amar-hospital/clinic-app.git
cd clinic-app
# Create and configure the .env file as specified in Section 2
nano .env
```

### Step B: Build and Start Services
We use Docker Compose with `docker-compose.prod.yml` to launch PostgreSQL, the NestJS Backend, and the React Portal using the configured `.env` file:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step C: Self-Healing Database Initialization
* **Schema Auto-Sync**: The NestJS backend automatically synchronizes TypeORM entities with the PostgreSQL database on startup.
* **Daily Token Sequences**: Because the platform uses database-level sequences (Option B), the backend automatically runs a `CREATE SEQUENCE IF NOT EXISTS` query for the current calendar date at request-time before calling `nextval()`. No manual setup or SQL migration is needed.

---

## 4. Reverse Proxy & SSL Setup

Install Nginx on the host machine:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

Configure Nginx in `/etc/nginx/sites-available/amar-hospital`:
```nginx
server {
    server_name admin.amarhospital.com;

    location / {
        proxy_pass http://localhost:8080; # Portal container port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    server_name api.amarhospital.com;

    location / {
        proxy_pass http://localhost:3000; # Backend container port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the configuration and obtain SSL certificates:
```bash
sudo ln -s /etc/nginx/sites-available/amar-hospital /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtain Certificates
sudo certbot --nginx -d admin.amarhospital.com -d api.amarhospital.com
```

---

## 5. Daily Database Backups

Create a backup script at `/opt/backup_db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
FILENAME="amar_hospital_$(date +%F_%T).sql"
docker exec -t clinic-app-db-1 pg_dump -U amar_admin amar_hospital > "$BACKUP_DIR/$FILENAME"
# Delete backups older than 14 days
find "$BACKUP_DIR" -type f -mtime +14 -delete
```

Make it executable and add to the system crontab (`sudo crontab -e`) to run every day at 11:30 PM:
```cron
30 23 * * * /bin/bash /opt/backup_db.sh
```

---

## 6. Log Monitoring & Audit Logs
* Logs are outputted by Docker. View backend logs using:
  ```bash
  docker compose logs -f backend
  ```
* All critical database actions (approvals, cancellations, status changes) are written to the `audit_logs` table in the database and can be queried or viewed in the admin dashboard.
