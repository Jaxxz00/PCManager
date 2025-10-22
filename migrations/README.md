# Database Migrations

Questo folder contiene le migrazioni SQL manuali per il database MySQL/MariaDB.

## Come Eseguire le Migrazioni

### Metodo 1: Drizzle Kit (Raccomandato)

Se hai già configurato `DATABASE_URL` nel file `.env`:

```bash
# Esegui push dello schema corrente
npm run db:push
```

Questo comando sincronizzerà automaticamente lo schema del database con quello definito in `shared/schema.ts`.

### Metodo 2: SQL Manuale

Se preferisci eseguire le migrazioni manualmente:

```bash
# Connettiti al database MySQL
mysql -u username -p database_name

# Esegui la migrazione
source migrations/001_add_employee_address.sql;
```

Oppure:

```bash
# Esegui direttamente dalla command line
mysql -u username -p database_name < migrations/001_add_employee_address.sql
```

## Migrazioni Disponibili

### 001_add_employee_address.sql
- **Data**: 2025-10-22
- **Descrizione**: Aggiunge il campo `address` alla tabella `employees`
- **Motivo**: Necessario per la generazione dei PDF manleva con indirizzo dipendente
- **Rollback**: `ALTER TABLE employees DROP COLUMN address;`

## Verifica Migrazioni Applicate

Dopo aver eseguito una migrazione, verifica che sia stata applicata correttamente:

```sql
-- Controlla la struttura della tabella employees
DESCRIBE employees;

-- Oppure
SHOW CREATE TABLE employees;
```

## Note Importanti

- ⚠️ **Esegui sempre un backup del database prima di applicare migrazioni in produzione**
- Le migrazioni sono idempotenti: se una migrazione fallisce, può essere ripetuta
- Drizzle Kit (`npm run db:push`) è il metodo raccomandato per ambienti di sviluppo
- Per produzione, considera l'uso di tool come Flyway o Liquibase per gestione avanzata delle migrazioni

## Configurazione Database

Assicurati di avere il file `.env` configurato correttamente:

```env
DATABASE_URL=mysql://username:password@localhost:3306/pcmanager
```

Se non hai ancora configurato il database, l'applicazione userà automaticamente `JsonStorage` (file-based storage in `data.json`).
