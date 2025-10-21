# Configurazione Variabili d'Ambiente

Crea un file `.env` nella root del progetto con queste variabili:

```env
# Database Configuration
# MySQL/MariaDB connection string
# Se non specificato, verrà utilizzato JSON storage (solo per sviluppo locale)
DATABASE_URL=mysql://user:password@host:3306/database

# Server Configuration
PORT=5000
NODE_ENV=production

# Application URL (per generare link di invito corretti)
APP_URL=https://tuodominio.com

# Session Configuration (genera una chiave casuale sicura)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

## 📝 Note

### Database
- **Development**: Se `DATABASE_URL` non è impostato, il sistema usa la memoria in-memory
- **Production**: `DATABASE_URL` è **obbligatorio** in produzione

### APP_URL
- Usato per generare i link di invito utente
- In development: `http://localhost:5000`
- In production: `https://tuodominio.com`

### Inviti Utente
Il sistema genera automaticamente link di invito che puoi copiare e condividere manualmente via:
- 📧 Email personale
- 💬 WhatsApp
- 📱 SMS
- 💼 Qualsiasi altro canale

**Nessuna configurazione email richiesta!**

