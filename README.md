# PC Manager - Sistema Gestionale IT Aziendale

Sistema completo per la gestione di computer, dipendenti, asset IT e documentazione aziendale.

## 🚀 Caratteristiche

- **Gestione Dipendenti**: Anagrafica completa con assegnazione asset
- **Inventario IT**: PC, smartphone, SIM, monitor, tastiere e altro
- **Dashboard Real-time**: Statistiche live e notifiche intelligenti
- **Workflow Assegnazione**: Processo guidato per assegnazione PC con generazione manleva
- **Gestione Documenti**: Upload e organizzazione documenti con tagging
- **Manutenzione**: Centro manutenzione con priorità, costi e tracking tecnici
- **Storico PC**: Tracciamento completo eventi e modifiche
- **Autenticazione 2FA**: Google Authenticator per sicurezza enterprise
- **Rate Limiting**: Protezione anti-bruteforce e DDoS
- **Multi-utente**: Sistema ruoli admin/user con gestione permessi

## 🛠️ Tecnologie

### Backend
- **Node.js** + **Express** - API REST
- **TypeScript** - Type safety
- **MySQL/MariaDB** - Database relazionale
- **Drizzle ORM** - Query builder type-safe
- **bcrypt** - Hashing password
- **Helmet** - Security headers
- **Rate Limiting** - Protezione API

### Frontend
- **React** + **TypeScript**
- **Vite** - Build tool veloce
- **TanStack Query** - State management server
- **React Hook Form** - Form validation
- **Zod** - Schema validation
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Componenti UI

## 📋 Prerequisiti

- **Node.js** 18+
- **MySQL** 8.0+ o **MariaDB** 10.6+
- **npm** o **pnpm**

## 🔧 Installazione Locale

### 1. Clone del repository
```bash
git clone https://github.com/Jaxxz00/PCManager.git
cd PCManager
```

### 2. Installa dipendenze
```bash
npm install
```

### 3. Configura database MySQL/MariaDB
Crea un database MySQL/MariaDB e ottieni la connection string:
```
mysql://username:password@localhost:3306/pcmanager
```

### 4. Configura variabili d'ambiente
Crea un file `.env` nella root del progetto:
```env
# Database
DATABASE_URL=mysql://username:password@localhost:3306/pcmanager

# Server
NODE_ENV=development
PORT=5000

# Session (genera una stringa random sicura)
SESSION_SECRET=your-super-secret-key-here

# Email (opzionale - per inviti utenti)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com

# Google Cloud Storage (opzionale - per upload documenti)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
```

### 5. Inizializza database
```bash
npm run db:push
```

### 6. Avvia in sviluppo
```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5000`

## 🐳 Deploy con Docker (CONSIGLIATO)

### 1. Crea Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --only=production

# Copia il codice
COPY . .

# Build frontend
RUN npm run build

# Esponi porta
EXPOSE 5000

# Avvia applicazione
CMD ["npm", "start"]
```

### 2. Crea docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://pcmanager:password@db:3306/pcmanager
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mariadb:10.11
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=pcmanager
      - MYSQL_USER=pcmanager
      - MYSQL_PASSWORD=password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

### 3. Deploy su server
```bash
# Sul tuo server
git clone https://github.com/Jaxxz00/PCManager.git
cd PCManager

# Crea file .env con le tue variabili
nano .env

# Avvia con Docker Compose
docker-compose up -d

# Verifica logs
docker-compose logs -f
```

## 🌐 Deploy su Server Personale (Senza Docker)

### 1. Installa prerequisiti sul server
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm mysql-server nginx
# Oppure per MariaDB:
# sudo apt install -y nodejs npm mariadb-server nginx

# Verifica versioni
node --version  # Deve essere 18+
npm --version
```

### 2. Configura MySQL/MariaDB
```bash
# Configura MySQL sicuro
sudo mysql_secure_installation

# Crea database e utente
sudo mysql
CREATE DATABASE pcmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pcmanager'@'localhost' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON pcmanager.* TO 'pcmanager'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Clone e setup applicazione
```bash
cd /var/www
git clone https://github.com/Jaxxz00/PCManager.git
cd PCManager

# Installa dipendenze
npm install

# Crea file .env
nano .env
# Aggiungi DATABASE_URL e altre variabili

# Build applicazione
npm run build

# Inizializza database
npm run db:push
```

### 4. Configura PM2 (process manager)
```bash
# Installa PM2
npm install -g pm2

# Avvia applicazione
pm2 start npm --name "pcmanager" -- start

# Configura autostart
pm2 startup
pm2 save
```

### 5. Configura Nginx (reverse proxy)
```bash
sudo nano /etc/nginx/sites-available/pcmanager
```

Contenuto:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

Attiva configurazione:
```bash
sudo ln -s /etc/nginx/sites-available/pcmanager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup HTTPS con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔐 Credenziali Default

**Username**: `admin`  
**Password**: `admin123`

⚠️ **IMPORTANTE**: Cambia la password dopo il primo accesso!

## 📦 Script NPM Disponibili

```bash
npm run dev          # Avvia in sviluppo (porta 5000)
npm run build        # Build per produzione
npm start            # Avvia in produzione
npm run check        # Type checking TypeScript
npm run db:push      # Sincronizza schema database
```

## 🔄 Aggiornamenti

```bash
# Sul server
cd /var/www/PCManager
git pull origin main
npm install
npm run build
pm2 restart pcmanager
```

## 🐛 Troubleshooting

### Il server non si avvia
- Verifica che MySQL/MariaDB sia attivo: `sudo systemctl status mysql` (o `mariadb`)
- Controlla i log: `pm2 logs pcmanager`
- Verifica DATABASE_URL nel file .env

### Errore connessione database
- Verifica credenziali MySQL/MariaDB
- Controlla che il database esista: `mysql -u pcmanager -p pcmanager`
- Verifica firewall non blocchi porta 3306

### Porta 5000 già in uso
- Cambia PORT nel file .env
- Aggiorna configurazione Nginx di conseguenza

## 📝 Note di Sicurezza

1. **Cambia SESSION_SECRET** con una stringa random sicura
2. **Usa password forti** per database e utenti
3. **Abilita firewall** sul server (UFW/iptables)
4. **Configura backup automatici** del database
5. **Usa HTTPS** in produzione (Let's Encrypt)
6. **Limita accesso SSH** con chiavi invece di password

## 📄 Licenza

MIT License - Progetto sviluppato per Maori Group

## 🤝 Supporto

Per problemi o domande, apri una issue su GitHub.

---

**Sviluppato con ❤️ per la gestione IT aziendale**

