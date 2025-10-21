# 🚀 Guida Deployment PCManager su VPS

Guida completa per il deployment di PCManager su un server VPS (Ubuntu/Debian).

---

## 📋 Prerequisiti VPS

### Requisiti Minimi
- **OS**: Ubuntu 20.04+ / Debian 11+
- **RAM**: 2GB minimo (consigliato 4GB)
- **Storage**: 20GB minimo
- **CPU**: 2 core minimo
- **Accesso**: Root o sudo

### Provider VPS Consigliati
- **DigitalOcean** - $6/mese (droplet base)
- **Hetzner** - €4/mese (ottimo rapporto qualità/prezzo)
- **Linode/Akamai** - $5/mese
- **Vultr** - $6/mese
- **Contabo** - €5/mese (economico)

---

## 🔧 FASE 1: Preparazione VPS

### 1.1 - Connettiti al VPS via SSH

```bash
ssh root@TUO_IP_VPS
# oppure
ssh utente@TUO_IP_VPS
```

### 1.2 - Aggiorna il sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 - Installa prerequisiti base

```bash
# Installa Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifica installazione
node --version  # Deve essere v20.x
npm --version   # Deve essere 10.x+

# Installa altri tool necessari
sudo apt install -y git nginx certbot python3-certbot-nginx ufw
```

### 1.4 - Installa e configura MySQL

```bash
# Installa MySQL Server
sudo apt install -y mysql-server

# Avvia e abilita MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Esegui configurazione sicura
sudo mysql_secure_installation
# Rispondi:
# - Validate Password: YES (scegli livello medio/alto)
# - Set root password: YES (inserisci password sicura)
# - Remove anonymous users: YES
# - Disallow root login remotely: YES
# - Remove test database: YES
# - Reload privilege tables: YES
```

### 1.5 - Crea database e utente MySQL

```bash
# Accedi a MySQL
sudo mysql -u root -p

# Nel prompt MySQL, esegui:
CREATE DATABASE pcmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pcmanager'@'localhost' IDENTIFIED BY 'PASSWORD_SICURA_QUI';
GRANT ALL PRIVILEGES ON pcmanager.* TO 'pcmanager'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Testa la connessione
mysql -u pcmanager -p pcmanager
# Se entra correttamente, digita EXIT;
```

### 1.6 - Configura Firewall

```bash
# Abilita firewall UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permetti SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Attiva firewall
sudo ufw enable

# Verifica status
sudo ufw status
```

---

## 📦 FASE 2: Deploy dell'Applicazione

### 2.1 - Crea utente dedicato (best practice)

```bash
# Crea utente per l'app
sudo adduser pcmanager
sudo usermod -aG sudo pcmanager

# Passa all'utente
sudo su - pcmanager
```

### 2.2 - Clone del repository

```bash
# Clone nella home dell'utente
cd ~
git clone https://github.com/Jaxxz00/PCManager.git
cd PCManager
```

### 2.3 - Installa dipendenze

```bash
npm install --production=false
```

### 2.4 - Configura variabili d'ambiente

```bash
# Copia il template
cp .env.example .env

# Edita il file .env
nano .env
```

**Configura questi valori nel file .env**:

```env
# Database - USA LE CREDENZIALI MYSQL CREATI PRIMA
DATABASE_URL=mysql://pcmanager:PASSWORD_SICURA_QUI@localhost:3306/pcmanager

# Server
PORT=5000
NODE_ENV=production

# URL pubblico (sostituisci con il tuo dominio o IP)
APP_URL=https://tuodominio.com

# Session secret - GENERA UNA CHIAVE RANDOM!
# Esegui: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=INSERISCI_QUI_LA_CHIAVE_GENERATA
```

**Per generare SESSION_SECRET sicuro**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Salva il file (CTRL+X, poi Y, poi ENTER).

### 2.5 - Inizializza database

```bash
npm run db:push
```

### 2.6 - Build dell'applicazione

```bash
npm run build
```

### 2.7 - Test locale

```bash
# Testa che l'app si avvii
NODE_ENV=production npm start

# Premi CTRL+C per fermare dopo il test
```

---

## 🔄 FASE 3: Setup PM2 (Process Manager)

### 3.1 - Installa PM2 globalmente

```bash
sudo npm install -g pm2
```

### 3.2 - Avvia l'applicazione con PM2

```bash
cd ~/PCManager

# Avvia l'app
pm2 start npm --name "pcmanager" -- start

# Verifica status
pm2 status
pm2 logs pcmanager
```

### 3.3 - Configura autostart al riavvio

```bash
# Salva la configurazione PM2
pm2 save

# Genera script di startup
pm2 startup systemd

# Copia ed esegui il comando che PM2 ti suggerisce
# Esempio output:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pcmanager --hp /home/pcmanager
# ESEGUI IL COMANDO SUGGERITO!
```

### 3.4 - Comandi utili PM2

```bash
# Vedi logs in tempo reale
pm2 logs pcmanager

# Restart dell'app
pm2 restart pcmanager

# Stop dell'app
pm2 stop pcmanager

# Status di tutte le app
pm2 status

# Monitora risorse
pm2 monit
```

---

## 🌐 FASE 4: Configurazione Nginx (Reverse Proxy)

### 4.1 - Crea configurazione Nginx

```bash
sudo nano /etc/nginx/sites-available/pcmanager
```

**Inserisci questa configurazione**:

```nginx
server {
    listen 80;
    server_name tuodominio.com www.tuodominio.com;  # SOSTITUISCI CON IL TUO DOMINIO

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Max upload size
    client_max_body_size 10M;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache per asset statici
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

**Salva il file** (CTRL+X, Y, ENTER).

### 4.2 - Attiva la configurazione

```bash
# Crea symlink
sudo ln -s /etc/nginx/sites-available/pcmanager /etc/nginx/sites-enabled/

# Rimuovi configurazione default (opzionale)
sudo rm /etc/nginx/sites-enabled/default

# Testa la configurazione
sudo nginx -t

# Se OK, riavvia Nginx
sudo systemctl restart nginx
```

---

## 🔒 FASE 5: Setup HTTPS con Let's Encrypt

### 5.1 - Verifica DNS

**PRIMA di procedere**, assicurati che:
- Il tuo dominio punti all'IP del VPS
- Record A per `tuodominio.com` → IP_VPS
- Record A per `www.tuodominio.com` → IP_VPS

Verifica con:
```bash
nslookup tuodominio.com
```

### 5.2 - Ottieni certificato SSL

```bash
sudo certbot --nginx -d tuodominio.com -d www.tuodominio.com
```

Segui le istruzioni:
- Inserisci la tua email
- Accetta i termini di servizio
- Scegli se ricevere newsletter (opzionale)
- Scegli redirect automatico HTTP → HTTPS: **YES**

### 5.3 - Verifica rinnovo automatico

```bash
# Testa il rinnovo (dry-run)
sudo certbot renew --dry-run

# Il certificato si rinnoverà automaticamente ogni 60 giorni
```

---

## 🎉 FASE 6: Verifica e Test

### 6.1 - Test completo

```bash
# Controlla status PM2
pm2 status

# Controlla logs per errori
pm2 logs pcmanager --lines 50

# Verifica Nginx
sudo systemctl status nginx

# Test connettività
curl -I http://localhost:5000
```

### 6.2 - Accedi all'applicazione

Apri il browser e vai su:
```
https://tuodominio.com
```

**Credenziali default**:
- Username: `admin`
- Password: `admin123`

⚠️ **CAMBIA SUBITO LA PASSWORD!**

---

## 🔧 MANUTENZIONE E AGGIORNAMENTI

### Aggiornare l'applicazione

```bash
# Accedi al VPS
ssh pcmanager@TUO_IP_VPS

# Vai nella cartella
cd ~/PCManager

# Ferma l'app
pm2 stop pcmanager

# Pull delle modifiche
git pull origin main

# Installa dipendenze aggiornate
npm install

# Rebuild
npm run build

# Riavvia
pm2 restart pcmanager

# Verifica logs
pm2 logs pcmanager --lines 50
```

### Backup del database

```bash
# Crea backup
mysqldump -u pcmanager -p pcmanager > backup_$(date +%Y%m%d).sql

# Restore da backup
mysql -u pcmanager -p pcmanager < backup_20250101.sql
```

### Monitoraggio

```bash
# Spazio disco
df -h

# RAM usage
free -h

# CPU e processi
htop

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs PM2
pm2 logs pcmanager
```

---

## 🆘 TROUBLESHOOTING

### App non si avvia

```bash
# Controlla logs
pm2 logs pcmanager --err --lines 100

# Verifica variabili d'ambiente
cat ~/PCManager/.env

# Testa connessione MySQL
mysql -u pcmanager -p pcmanager

# Riavvia tutto
pm2 restart pcmanager
```

### Errore 502 Bad Gateway

```bash
# Verifica che l'app sia running
pm2 status

# Controlla logs Nginx
sudo tail -f /var/log/nginx/error.log

# Verifica porta 5000 sia in ascolto
sudo netstat -tulpn | grep 5000
```

### Certificato SSL scaduto

```bash
# Rinnova manualmente
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

### Database non si connette

```bash
# Verifica MySQL sia attivo
sudo systemctl status mysql

# Riavvia MySQL
sudo systemctl restart mysql

# Controlla credenziali
mysql -u pcmanager -p pcmanager
```

---

## 📊 PERFORMANCE TUNING (Opzionale)

### Abilita compressione Gzip in Nginx

Aggiungi in `/etc/nginx/nginx.conf` dentro il blocco `http`:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

Poi:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Ottimizza MySQL per piccoli VPS

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Aggiungi (per VPS con 2GB RAM):
```ini
[mysqld]
innodb_buffer_pool_size = 512M
innodb_log_file_size = 64M
max_connections = 50
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

---

## 🔐 SICUREZZA AGGIUNTIVA

### Disabilita login SSH con password

```bash
sudo nano /etc/ssh/sshd_config
```

Modifica:
```
PasswordAuthentication no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### Installa Fail2Ban (protezione brute-force)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## ✅ CHECKLIST FINALE

- [ ] MySQL installato e configurato
- [ ] Database pcmanager creato
- [ ] Applicazione clonata e buildata
- [ ] File .env configurato con SESSION_SECRET sicuro
- [ ] PM2 configurato con autostart
- [ ] Nginx configurato come reverse proxy
- [ ] HTTPS attivo con Let's Encrypt
- [ ] Firewall UFW attivo
- [ ] Password admin cambiata dopo primo login
- [ ] Backup database configurato

---

## 📞 SUPPORTO

Per problemi o domande:
- GitHub Issues: https://github.com/Jaxxz00/PCManager/issues
- Email: [inserisci email]

---

**🎉 Congratulazioni! PCManager è ora in produzione sul tuo VPS!**
