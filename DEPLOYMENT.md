# Backend Deployment Guide (AWS EC2 + Nginx + SSL)

## 1. AWS EC2 Setup
- Launch an EC2 instance (Ubuntu 22.04 LTS recommended).
- Allow inbound traffic on ports: 22 (SSH), 80 (HTTP), 443 (HTTPS).
- Connect via SSH: `ssh -i key.pem ubuntu@your-ec2-ip`

## 2. Install Dependencies
```bash
sudo apt update
sudo apt install -y nodejs npm nginx postgresql postgresql-contrib
# Install PM2 globally
sudo npm install -g pm2
```

## 3. Database Setup (If using local Postgres on EC2)
(Skip if using AWS RDS)
```bash
sudo -u postgres psql
CREATE DATABASE ca_db;
CREATE USER myuser WITH ENCRYPTED PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE ca_db TO myuser;
\q
```

## 4. Deploy Code
- Clone your repository:
```bash
git clone https://github.com/your-repo/ca-backend.git
cd ca-backend
npm install
```

## 5. Environment Configuration
- Create `.env` file:
```bash
cp .env.example .env
nano .env
```
- Update `DATABASE_URL`, `JWT_SECRET`, AWS keys, etc.

## 6. Database Migration
```bash
npx prisma generate
npx prisma migrate deploy
```

## 7. Start Application with PM2
```bash
pm2 start src/server.js --name "ca-backend"
pm2 save
pm2 startup
```

## 8. Nginx Configuration
- Edit default config:
```bash
sudo nano /etc/nginx/sites-available/default
```
- Replace content with:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
- Restart Nginx:
```bash
sudo systemctl restart nginx
```

## 9. SSL Certificate (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```
- Follow prompts to enable HTTPS.

## 10. Verification
- Visit `https://api.yourdomain.com/api/services` to verify it's running.
