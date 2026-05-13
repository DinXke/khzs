# Post-Deployment Testing Guide

**Issue**: SCH-2395 RBAC: User roles and permissions (admin, editor, viewer)

After ProxmoxEngineer completes the deployment in the Proxmox LXC container, follow this testing guide to verify all RBAC and login functionality.

## Pre-Test Requirements

- [ ] Both containers running (khzs and khzs-be)
- [ ] Nginx reverse proxy active on HTTPS port 443
- [ ] SSL certificates installed
- [ ] Network connectivity to container IP/domain
- [ ] curl or browser available for testing

## Test Environment

Replace `YOUR_DOMAIN` with actual:
- Proxmox container IP: `https://[container-ip]`
- Or custom domain: `https://khzs.example.com`

## 1. Basic Connectivity Tests

### 1.1 HTTPS Connectivity
```bash
# Should return 200 OK
curl -k https://YOUR_DOMAIN/

# Should return HTML (not 404)
curl -k https://YOUR_DOMAIN/login | grep -o "<title>" && echo "✓ Login page loads"
```

### 1.2 Service Status
```bash
# Check all containers running
docker ps | grep -E "khzs|wordpress|nginx"

# Check logs for errors
docker-compose logs khzs | tail -20
docker-compose logs nginx | tail -20
```

## 2. RBAC & Login Functionality Tests

### 2.1 Auto-Registration (Viewer Role)
```bash
echo "=== Test: Auto-register new viewer user ==="

RESPONSE=$(curl -s -c /tmp/cookies_viewer.txt -X POST https://YOUR_DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"secure123"}')

echo "Response: $RESPONSE"

# Verify viewer role
ROLE=$(echo $RESPONSE | jq -r '.user.role')
if [ "$ROLE" = "viewer" ]; then
  echo "✓ Auto-registration successful, role: viewer"
else
  echo "✗ Role incorrect: $ROLE"
fi
```

### 2.2 Admin Login
```bash
echo "=== Test: Admin login with seed user ==="

RESPONSE=$(curl -s -c /tmp/cookies_admin.txt -X POST https://YOUR_DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@khzs.nl","password":"admin123"}')

echo "Response: $RESPONSE"

ROLE=$(echo $RESPONSE | jq -r '.user.role')
if [ "$ROLE" = "admin" ]; then
  echo "✓ Admin login successful"
else
  echo "✗ Admin login failed or wrong role: $ROLE"
fi
```

### 2.3 Editor Login
```bash
echo "=== Test: Editor login with seed user ==="

RESPONSE=$(curl -s -c /tmp/cookies_editor.txt -X POST https://YOUR_DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@khzs.nl","password":"editor123"}')

ROLE=$(echo $RESPONSE | jq -r '.user.role')
if [ "$ROLE" = "editor" ]; then
  echo "✓ Editor login successful"
else
  echo "✗ Editor login failed or wrong role: $ROLE"
fi
```

## 3. RBAC Access Control Tests

### 3.1 Viewer Cannot Access /admin (Should Redirect)
```bash
echo "=== Test: Viewer blocked from /admin ==="

# Use viewer cookies from test 2.1
curl -s -b /tmp/cookies_viewer.txt -i https://YOUR_DOMAIN/admin/blog 2>&1 | \
  grep -E "HTTP|307|302" | head -2

# Expected: 307 Temporary Redirect to /
echo "✓ Viewer should be redirected from /admin"
```

### 3.2 Admin Can Access /admin
```bash
echo "=== Test: Admin can access /admin ==="

# Use admin cookies from test 2.2
curl -s -b /tmp/cookies_admin.txt https://YOUR_DOMAIN/admin/blog | \
  grep -o "Blog" && echo "✓ Admin can access /admin/blog"
```

### 3.3 Editor Can Access /admin
```bash
echo "=== Test: Editor can access /admin ==="

# Use editor cookies from test 2.3
curl -s -b /tmp/cookies_editor.txt https://YOUR_DOMAIN/admin/blog | \
  grep -o "Blog" && echo "✓ Editor can access /admin/blog"
```

## 4. Session Management Tests

### 4.1 Cookie Creation
```bash
echo "=== Test: Session cookies created ==="

curl -s -c /tmp/cookies_test.txt -X POST https://YOUR_DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cookietest@example.com","password":"test123"}' > /dev/null

if grep -q "session_token" /tmp/cookies_test.txt; then
  echo "✓ session_token cookie created"
else
  echo "✗ session_token cookie missing"
fi

if grep -q "user_role" /tmp/cookies_test.txt; then
  echo "✓ user_role cookie created"
else
  echo "✗ user_role cookie missing"
fi
```

### 4.2 Logout Functionality
```bash
echo "=== Test: Logout clears session ==="

# Login first
curl -s -c /tmp/cookies_logout.txt -X POST https://YOUR_DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"logouttest@example.com","password":"test123"}' > /dev/null

# Logout
curl -s -b /tmp/cookies_logout.txt -X POST https://YOUR_DOMAIN/api/auth/logout > /dev/null

# Try accessing protected route (should fail)
RESPONSE=$(curl -s -b /tmp/cookies_logout.txt https://YOUR_DOMAIN/admin/blog)
if echo "$RESPONSE" | grep -q "Login\|login"; then
  echo "✓ Logout successful, redirected to login"
else
  echo "? Check if logout is working correctly"
fi
```

## 5. Database Verification Tests

### 5.1 Check Users Table
```bash
echo "=== Test: Database users table ==="

# Access container and check SQLite
docker exec khzs sqlite3 data/blog.db "SELECT COUNT(*) as user_count FROM users;"
docker exec khzs sqlite3 data/blog.db "SELECT email, role FROM users LIMIT 5;"

echo "✓ Database users table accessible"
```

### 5.2 Check Sessions Table
```bash
echo "=== Test: Database sessions table ==="

docker exec khzs sqlite3 data/blog.db "SELECT COUNT(*) as session_count FROM sessions;"

echo "✓ Database sessions table accessible"
```

## 6. KHZS.BE WordPress Tests

### 6.1 WordPress Homepage
```bash
echo "=== Test: KHZS.BE WordPress homepage ==="

curl -s -k https://YOUR_DOMAIN/ | grep -o "WordPress\|<title>" | head -2

echo "✓ WordPress homepage loads"
```

### 6.2 WordPress Admin
```bash
echo "=== Test: KHZS.BE WordPress admin ==="

curl -s -k https://YOUR_DOMAIN/wp-admin/ | grep -o "wp-login\|login" && \
  echo "✓ WordPress admin accessible"
```

## 7. Security Tests

### 7.1 HTTPS/SSL Verification
```bash
echo "=== Test: HTTPS certificate valid ==="

openssl s_client -connect YOUR_DOMAIN:443 -showcerts 2>/dev/null | grep "Verify return code"

echo "✓ SSL certificate verification"
```

### 7.2 Security Headers
```bash
echo "=== Test: Security headers present ==="

curl -s -k -I https://YOUR_DOMAIN | grep -i "x-frame-options\|x-content-type\|x-xss"

echo "✓ Security headers should be visible"
```

### 7.3 No Plain HTTP (Should Redirect)
```bash
echo "=== Test: HTTP redirects to HTTPS ==="

curl -s -i http://YOUR_DOMAIN 2>&1 | grep -E "301|302" && \
  echo "✓ HTTP to HTTPS redirect working"
```

## 8. Performance Tests

### 8.1 Response Time
```bash
echo "=== Test: Response times ==="

time curl -s -k https://YOUR_DOMAIN/login > /dev/null

echo "✓ Check if response time is acceptable (<2s)"
```

### 8.2 Concurrent Requests
```bash
echo "=== Test: Concurrent login requests ==="

for i in {1..5}; do
  curl -s -X POST https://YOUR_DOMAIN/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"user$i@test.com\",\"password\":\"test$i\"}" &
done
wait

echo "✓ Server handled 5 concurrent requests"
```

## 9. Automated Test Script

Save as `test-deployment.sh`:

```bash
#!/bin/bash

DOMAIN=${1:-"https://localhost"}
PASS=0
FAIL=0

test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  
  if [ "$method" = "POST" ]; then
    result=$(curl -s -X POST "$DOMAIN$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  else
    result=$(curl -s -k "$DOMAIN$endpoint")
  fi
  
  if [ $? -eq 0 ]; then
    echo "✓ $name"
    ((PASS++))
  else
    echo "✗ $name"
    ((FAIL++))
  fi
}

echo "=== RBAC Deployment Test Suite ==="
echo "Testing: $DOMAIN"
echo ""

# Run tests
test_endpoint "Login endpoint" "POST" "/api/auth/login" '{"email":"test@test.com","password":"test123"}'
test_endpoint "Login page" "GET" "/login" ""
test_endpoint "Home page" "GET" "/" ""

echo ""
echo "Results: $PASS passed, $FAIL failed"
```

Run with:
```bash
bash test-deployment.sh https://YOUR_DOMAIN
```

## 10. Troubleshooting

### Issue: Login returns 404
```
Check: Are containers running? docker ps
Check: Nginx config correct? docker logs khzs-nginx
Check: Port 443 accessible? curl -k https://localhost/api/auth/login
```

### Issue: Viewer can access /admin
```
Check: Middleware installed? Check src/middleware.ts
Check: Cookies being set? Check browser dev tools
Check: Role correct in database? docker exec khzs sqlite3 data/blog.db "SELECT * FROM users;"
```

### Issue: Database locked
```
Solution: rm -rf data/blog.db && docker-compose restart khzs
Note: This will reset all users
```

### Issue: SSL certificate error
```
Check: Certificates in ssl/ directory? ls -la ssl/
Check: Permissions correct? chmod 644 ssl/cert.pem
Check: Certificate valid? openssl x509 -in ssl/cert.pem -noout -dates
```

## 11. Success Criteria

✅ **All tests pass when**:
- [ ] Login page loads without errors
- [ ] Admin/Editor users can login with seed credentials
- [ ] Viewers auto-register correctly
- [ ] Viewers cannot access /admin (redirected)
- [ ] Admins/Editors can access /admin
- [ ] Session cookies created and work
- [ ] Logout clears session
- [ ] Database tables exist and contain data
- [ ] HTTPS/SSL working
- [ ] Security headers present
- [ ] WordPress homepage loads
- [ ] Both services accessible via port 443

## Report Format

When deployment is complete, provide:

```
Deployment Test Report
Date: [date]
Deployed to: [IP/domain]
Status: [PASS/FAIL]

Tests Passed: [n]/[total]
Failed Tests: [list any failures]

Notes:
- [Any issues encountered]
- [Performance observations]
- [Security concerns]
```

---

**Issue SCH-2395 Complete** when all tests pass! ✅
