# KHZS Deployment Guide

## Overview
RBAC blog application met Next.js 16, Node.js, SQLite database en Nginx reverse proxy.

## System Requirements
- Node.js 20+
- Docker & Docker Compose (of equivalent)
- SSL certificates (voor HTTPS op port 443)
- 512MB RAM minimum
- Network access op poort 443

## Pre-Deployment Checklist

### 1. SSL Certificates
Plaats SSL certificaten in `ssl/` directory:
```bash
mkdir -p ssl
# Place your SSL certificates:
# - ssl/cert.pem (public certificate)
# - ssl/key.pem (private key)
```

### 2. Network Configuration
In Proxmox LXC container:
- Assign appropriate network interface (check available NICs)
- Configure static IP if needed
- Ensure port 443 is accessible (check firewall rules)

## Deployment Steps

### Via Docker Compose

```bash
# 1. Clone/sync the repository
git clone <repo-url> khzs
cd khzs

# 2. Build the Docker image
docker build -t khzs:latest .

# 3. Prepare SSL certificates
mkdir -p ssl
# Copy cert.pem and key.pem to ssl/

# 4. Start services
docker-compose up -d

# 5. Verify deployment
docker-compose logs -f khzs
curl -k https://localhost/login  # Should return login page
```

### Manual Deployment (Linux)

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install dependencies
npm ci

# 3. Build Next.js app
NODE_ENV=production npm run build

# 4. Install PM2 (for process management)
npm install -g pm2

# 5. Start app with PM2
PM2_HOME=/root/.pm2 pm2 start .next/standalone/server.js --name khzs --env NODE_ENV=production,PORT=3000

# 6. Setup Nginx reverse proxy
# Copy nginx.conf to /etc/nginx/sites-available/khzs
# Copy SSL certs to /etc/nginx/ssl/
# Create symlink: ln -s /etc/nginx/sites-available/khzs /etc/nginx/sites-enabled/
# Test: nginx -t
# Reload: systemctl reload nginx
```

## Environment Configuration

### Required Environment Variables
```bash
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

### Optional Configuration
```bash
# Database location (default: ./data/blog.db)
DB_PATH=/app/data/blog.db

# Upload directory
UPLOADS_DIR=/app/public/uploads
```

## Database Initialization

On first run, the database is automatically created with:
- Users table (with roles: admin, editor, viewer)
- Blog posts table
- Sessions table

### Seed Default Users
```bash
# Run seed script to create admin/editor users
npm run seed
# Creates:
# - admin@khzs.nl / admin123 (admin role)
# - editor@khzs.nl / editor123 (editor role)
```

## User Roles & Access Control

### Role Permissions
- **admin**: Full access to `/admin` panel
- **editor**: Full access to `/admin` panel  
- **viewer**: No admin access (default for auto-registered users)

### Access Control Routes
- `/login` - Public (login & auto-registration)
- `/api/auth/login` - Public (login endpoint)
- `/api/auth/logout` - Protected (logout endpoint)
- `/admin/*` - Protected (admin/editor only)
- `/api/*` - Protected (admin/editor only)
- `/` - Public (homepage)
- `/nieuws` - Public (blog list)
- `/nieuws/[slug]` - Public (blog detail)

## Health Check
```bash
# Test if app is running
curl -k https://your-domain/login

# Check API health
curl -k https://your-domain/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Troubleshooting

### Port 443 already in use
```bash
# Find process using port 443
sudo lsof -i :443
# Kill process if needed
sudo kill -9 <PID>
```

### SSL Certificate issues
- Ensure cert.pem and key.pem are in `ssl/` directory
- Verify certificate format (PEM)
- Check certificate expiration: `openssl x509 -in ssl/cert.pem -noout -dates`

### Database locked
```bash
# Remove old database and restart
rm -f data/blog.db
docker-compose restart khzs
```

### Slow file system warnings
Normal in network storage. Can be ignored in production if performance is acceptable.

## Monitoring

### View logs
```bash
# Docker
docker-compose logs -f khzs

# PM2
pm2 logs khzs
```

### Monitor resources
```bash
# Docker
docker stats khzs

# System
htop
```

## Backup

### Database backup
```bash
# Backup SQLite database
cp data/blog.db data/blog.db.backup

# Backup uploads
tar -czf uploads.tar.gz public/uploads/
```

## Security Notes
1. Change default seed user passwords after deployment
2. Use strong SSL certificates (not self-signed in production)
3. Keep Node.js and dependencies updated
4. Regularly backup the SQLite database
5. Monitor access logs for suspicious activity
6. Consider rate limiting on `/api/auth/login` endpoint

## Support & Debugging

### Check Node process
```bash
ps aux | grep node
```

### Test connectivity
```bash
curl -v https://your-domain/
```

### Check database
```bash
sqlite3 data/blog.db
sqlite> .schema
sqlite> SELECT * FROM users;
```
