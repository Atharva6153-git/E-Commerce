# Alternative n8n Setup (Without Docker)

If you're experiencing Docker issues, you can run n8n directly using npm.

## Option 1: Install n8n Globally (Recommended)

### Step 1: Install n8n

```bash
npm install -g n8n
```

### Step 2: Configure Environment Variables

Create a `.env` file or set environment variables:

**Windows PowerShell:**
```powershell
$env:N8N_BASIC_AUTH_ACTIVE="true"
$env:N8N_BASIC_AUTH_USER="admin"
$env:N8N_BASIC_AUTH_PASSWORD="admin123"
$env:N8N_PORT="5678"
$env:N8N_PROTOCOL="http"
$env:WEBHOOK_URL="http://localhost:5678/"

# PostgreSQL configuration (optional - uses SQLite by default)
$env:DB_TYPE="postgresdb"
$env:DB_POSTGRESDB_HOST="localhost"
$env:DB_POSTGRESDB_PORT="5440"
$env:DB_POSTGRESDB_DATABASE="n8n_db"
$env:DB_POSTGRESDB_USER="n8n_user"
$env:DB_POSTGRESDB_PASSWORD="n8n_password"
```

**Linux/Mac:**
```bash
export N8N_BASIC_AUTH_ACTIVE=true
export N8N_BASIC_AUTH_USER=admin
export N8N_BASIC_AUTH_PASSWORD=admin123
export N8N_PORT=5678
export N8N_PROTOCOL=http
export WEBHOOK_URL=http://localhost:5678/
```

### Step 3: Start n8n

```bash
n8n start
```

Or with custom port:
```bash
n8n start --tunnel
```

### Step 4: Access n8n

Open browser: **http://localhost:5678**
- Username: `admin`
- Password: `admin123`

---

## Option 2: Fix Docker Desktop DNS Issue

### Method A: Update Docker Desktop Settings

1. Open **Docker Desktop**
2. Go to **Settings** (gear icon)
3. Navigate to **Docker Engine**
4. Add DNS configuration:

```json
{
  "dns": ["8.8.8.8", "8.8.4.4"],
  "registry-mirrors": [],
  "insecure-registries": []
}
```

5. Click **Apply & Restart**
6. Try running `docker-compose up -d n8n` again

### Method B: Restart Docker Desktop

1. Right-click Docker Desktop icon in system tray
2. Select **Restart**
3. Wait for Docker to fully restart
4. Try again

### Method C: Use WSL2 Backend (Windows)

1. Open Docker Desktop Settings
2. Go to **General**
3. Enable **Use the WSL 2 based engine**
4. Click **Apply & Restart**

### Method D: Reset Docker Network

```bash
# Stop all containers
docker-compose down

# Remove networks
docker network prune -f

# Start again
docker-compose up -d n8n-db n8n
```

---

## Option 3: Use Local PostgreSQL (Without Docker)

If you have PostgreSQL installed locally:

### Step 1: Create Database

```sql
CREATE DATABASE n8n_db;
CREATE USER n8n_user WITH PASSWORD 'n8n_password';
GRANT ALL PRIVILEGES ON DATABASE n8n_db TO n8n_user;
```

### Step 2: Configure n8n

```bash
export DB_TYPE=postgresdb
export DB_POSTGRESDB_HOST=localhost
export DB_POSTGRESDB_PORT=5432
export DB_POSTGRESDB_DATABASE=n8n_db
export DB_POSTGRESDB_USER=n8n_user
export DB_POSTGRESDB_PASSWORD=n8n_password
```

### Step 3: Start n8n

```bash
n8n start
```

---

## Troubleshooting Docker Issues

### DNS Resolution Error

**Error:**
```
failed to resolve reference "docker.io/n8nio/n8n:latest"
```

**Solutions:**

1. **Check Internet Connection**
   ```bash
   ping google.com
   ```

2. **Flush DNS Cache (Windows)**
   ```powershell
   ipconfig /flushdns
   ```

3. **Check Docker Hub Status**
   - Visit: https://status.docker.com/

4. **Use Different Registry Mirror**
   
   Add to Docker Engine config:
   ```json
   {
     "registry-mirrors": ["https://mirror.gcr.io"]
   }
   ```

5. **Try Manual Pull**
   ```bash
   docker pull n8nio/n8n:latest
   ```

### HTTP Response Error

**Error:**
```
http: server gave HTTP response to HTTPS client
```

**Solution:**

1. Check Docker Desktop is updated
2. Restart Docker Desktop
3. Clear Docker cache:
   ```bash
   docker system prune -a
   ```

### Port Already in Use

**Error:**
```
Bind for 0.0.0.0:5678 failed: port is already allocated
```

**Solution:**

1. Check what's using the port:
   ```bash
   netstat -ano | findstr :5678
   ```

2. Kill the process or use different port:
   ```yaml
   ports:
     - "5679:5678"  # Change external port
   ```

---

## Recommended Approach

**For Development:**
- Use **npm installation** (simplest, no Docker issues)
- Quick to start and restart
- Easy debugging

**For Production:**
- Use **Docker** (containerized, isolated)
- Use **docker-compose** with proper DNS config
- Enable SSL/TLS with reverse proxy

---

## Quick Commands

### npm Installation
```bash
# Install
npm install -g n8n

# Start
n8n start

# Start with tunnel (for webhooks)
n8n start --tunnel

# Update
npm update -g n8n

# Uninstall
npm uninstall -g n8n
```

### Docker Commands
```bash
# Start
docker-compose up -d n8n

# Stop
docker-compose stop n8n

# Logs
docker-compose logs -f n8n

# Restart
docker-compose restart n8n

# Remove (keeps data)
docker-compose down

# Remove all (including data)
docker-compose down -v
```

---

## Data Storage Locations

### npm Installation
- **Windows:** `C:\Users\<username>\.n8n`
- **Linux/Mac:** `~/.n8n`

### Docker Installation
- Volume: `n8n_storage`
- Location: `/var/lib/docker/volumes/n8n_storage`

---

## Next Steps

Once n8n is running:

1. ✅ Access http://localhost:5678
2. ✅ Login with admin/admin123
3. ✅ Change password
4. ✅ Import workflow templates
5. ✅ Start creating automations

## Support

- [n8n Documentation](https://docs.n8n.io/)
- [Docker Troubleshooting](https://docs.docker.com/config/daemon/)
- [n8n Community Forum](https://community.n8n.io/)
