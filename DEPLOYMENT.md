# KHZS & KHZS.BE Deployment Guide

## Overview
Volledige deployment van twee applicaties:
1. **KHZS** - RBAC blog met Next.js 16, Node.js, SQLite en Nginx reverse proxy
2. **KHZS.BE** - WordPress clone met MySQL, Nginx en PhpMyAdmin

## System Requirements

### LXC Container Specification (Proxmox)
- **OS**: Ubuntu 24.04 LTS (Noble Numbat) - Recommended
- **CPU**: 2+ cores
- **RAM**: 2GB minimum (4GB recommended voor beide apps)
- **Storage**: 20GB+ (WordPress upload space)
- **Network**: Configured NIC with internet access

### Software Requirements
- Docker & Docker Compose (latest)
- Node.js 20+ (voor KHZS)
- MySQL 8.0 (in Docker, voor KHZS.BE)
- PHP 8.2+ (in Docker, voor WordPress)
- SSL certificates (HTTPS op port 443)

## Architectuur

```
┌─────────────────────────────────────────────────────────────┐
│                  Proxmox LXC Container                      │
│                    Ubuntu 24.04 LTS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Nginx Reverse Proxy (port 443)             │   │
│  │         SSL/TLS termination + routing                │   │
│  └──────────────────────────────────────────────────────┘   │
│           │                               │                 │
│           ▼                               ▼                 │
│  ┌─────────────────────┐     ┌──────────────────────┐      │
│  │   KHZS (Node.js)    │     │  KHZS.BE (WordPress) │      │
│  │   port 3000         │     │  port 8000/MySQL     │      │
│  ├─────────────────────┤     ├──────────────────────┤      │
│  │ - RBAC Blog CMS     │     │ - WordPress CMS      │      │
│  │ - SQLite DB         │     │ - MySQL 8.0 DB       │      │
│  │ - Login System      │     │ - PhpMyAdmin         │      │
│  │ - Admin Panel       │     │ - Theme/Plugins      │      │
│  └─────────────────────┘     └──────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Pre-Deployment Checklist

### 1. Container Setup (Ubuntu 24.04 LTS)
Bij Proxmox LXC container aanmaken:
- [ ] Base image: Ubuntu 24.04 LTS
- [ ] vCPU: 2 cores
- [ ] Memory: 4GB (2GB minimum)
- [ ] Disk: 20GB+
- [ ] Network: Configured static IP

### 2. SSL Certificates
Plaats SSL certificaten in `ssl/` directory (beide projects):
```bash
# KHZS project
mkdir -p ssl
cp /path/to/cert.pem ssl/cert.pem
cp /path/to/key.pem ssl/key.pem

# KHZS.BE project
mkdir -p ../_default/ssl
cp /path/to/cert.pem ../_default/ssl/cert.pem
cp /path/to/key.pem ../_default/ssl/key.pem
```

### 3. Network Configuration
In Proxmox LXC container:
- [ ] Assign appropriate network interface (check available NICs)
- [ ] Configure static IP if needed
- [ ] Ensure port 443 is accessible (check firewall rules)
- [ ] Enable port forwarding if needed

## Deployment Steps

### Complete Deployment (Both Projects)

```bash
# 1. Setup directory structure
mkdir -p /opt/khzs-apps
cd /opt/khzs-apps

# 2. Clone both projects
git clone <repo-url>/khzs khzs
git clone <repo-url>/khzs-be khzs-be  # (or copy _default folder)

# 3. Prepare SSL certificates
mkdir -p khzs/ssl
mkdir -p khzs-be/ssl
# Copy cert.pem and key.pem to both ssl/ directories

# 4. Start KHZS (RBAC Blog)
cd khzs
docker build -t khzs:latest .
docker-compose up -d

# 5. Start KHZS.BE (WordPress)
cd ../khzs-be
bash install.sh  # or docker-compose up -d

# 6. Verify both services
curl -k https://localhost/login          # KHZS
curl -k https://localhost/wp-admin/      # KHZS.BE WordPress
curl -k https://localhost:8081/          # PhpMyAdmin (optional)
```

### Individual Deployments

#### KHZS (RBAC Blog System)

```bash
cd khzs

# Build Docker image
docker build -t khzs:latest .

# Prepare SSL certificates
mkdir -p ssl
# Copy cert.pem and key.pem to ssl/

# Start services
docker-compose up -d

# Verify deployment
docker-compose logs -f khzs
curl -k https://localhost/login  # Should return login page
```

#### KHZS.BE (WordPress Clone)

```bash
cd khzs-be

# Run installation script (handles everything)
bash install.sh

# OR manually:
docker-compose up -d

# Verify deployment
curl -k https://localhost/  # Should return WordPress home
curl -k https://localhost:8081/  # PhpMyAdmin
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

## Directory Structure in LXC Container

```
/opt/khzs-apps/
├── khzs/                          # RBAC Blog System
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── ssl/
│   │   ├── cert.pem
│   │   └── key.pem
│   ├── data/                      # SQLite database
│   ├── public/uploads/
│   └── src/
│
└── khzs-be/                       # WordPress Clone
    ├── docker-compose.yml
    ├── nginx.conf
    ├── ssl/
    │   ├── cert.pem
    │   └── key.pem
    ├── app/                       # WordPress files
    ├── mysql-data/                # MySQL persistent data
    └── install.sh
```

## Health Check

### KHZS Health Checks
```bash
# Test login page
curl -k https://your-domain/login

# Check API health
curl -k https://your-domain/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Check admin access (if logged in)
curl -k https://your-domain/admin/blog

# Check Docker container status
docker ps -f "name=khzs"
docker-compose logs khzs
```

### KHZS.BE Health Checks
```bash
# Test WordPress homepage
curl -k https://your-domain/

# Test WordPress admin
curl -k https://your-domain/wp-admin/

# Test PhpMyAdmin (if enabled)
curl -k https://your-domain:8081/

# Check Docker containers
docker ps | grep khzs-be
docker-compose logs wordpress
docker-compose logs mysql
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
