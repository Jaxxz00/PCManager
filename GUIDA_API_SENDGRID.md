# Guida: Come Ottenere la Chiave API SendGrid

## Cos'è SendGrid?
SendGrid è un servizio di invio email affidabile utilizzato da migliaia di aziende per inviare email transazionali (notifiche, inviti, conferme, etc.). È gratuito per iniziare.

## Piano Gratuito SendGrid
- **Primo mese**: 40.000 email gratuite
- **Dopo il primo mese**: 100 email al giorno gratuite
- Perfetto per Maori Group e piccole/medie aziende

## Passo 1: Registrazione Account

1. Vai su [https://sendgrid.com](https://sendgrid.com)
2. Clicca su "Start for Free" o "Get Started"
3. Compila il form di registrazione:
   - **Email**: usa un indirizzo email aziendale (es: admin@maorigroup.com)
   - **Password**: scegli una password sicura
   - **Nome azienda**: "Maori Group"
   - **Sito web**: il sito di Maori Group se disponibile

## Passo 2: Verifica Account

1. Controlla la tua email per il messaggio di verifica da SendGrid
2. Clicca sul link di verifica
3. Completa il setup del profilo:
   - **Settore**: Scegli quello più appropriato (es: "Technology", "Business Services")
   - **Numero dipendenti**: Seleziona la dimensione di Maori Group
   - **Paese**: Italia

## Passo 3: Configurazione Dominio (Opzionale ma Consigliato)

Per migliorare la deliverability delle email:
1. Nel dashboard SendGrid, vai a "Settings" → "Sender Authentication"
2. Clicca su "Authenticate Your Domain"
3. Inserisci il dominio aziendale (es: maorigroup.com)
4. Segui le istruzioni per aggiungere i record DNS

**Nota**: Se non hai accesso ai DNS, puoi saltare questo step per ora.

## Passo 4: Creazione API Key

### Accesso alle API Keys:
1. Nel dashboard SendGrid, clicca su "Settings" nel menu laterale
2. Seleziona "API Keys"
3. Clicca su "Create API Key"

### Configurazione API Key:
1. **Nome**: "PC Manager Maori Group" (per identificarla facilmente)
2. **Permessi**: Seleziona "Restricted Access"
3. **Permessi specifici**:
   - Mail Send: **FULL ACCESS** ✅
   - Template Engine: **READ ACCESS** (opzionale)
   - Tutti gli altri: **NO ACCESS**

### Salva la Chiave:
1. Clicca "Create & View"
2. **IMPORTANTE**: Copia immediatamente la chiave API
3. **ATTENZIONE**: La chiave viene mostrata solo una volta!
4. Conserva la chiave in un posto sicuro

## Passo 5: Configurazione nel Sistema PC Manager

Una volta ottenuta la chiave API:

1. **Nel Replit**: Vai alle impostazioni del progetto
2. **Secrets**: Aggiungi una nuova variabile d'ambiente:
   - **Nome**: `SENDGRID_API_KEY`
   - **Valore**: La chiave API copiata da SendGrid (inizia con "SG.")

## Passo 6: Test del Sistema

Dopo aver configurato la chiave:

1. **Accedi** al sistema PC Manager come amministratore
2. **Vai** nelle Configurazioni → Gestione Utenti
3. **Crea** un nuovo utente di test
4. **Verifica** che l'email di invito venga inviata

## Formato della Chiave API

La chiave SendGrid ha questo formato:
```
SG.xxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- Inizia sempre con "SG."
- È lunga circa 70 caratteri
- Contiene lettere, numeri e alcuni caratteri speciali

## Risoluzione Problemi Comuni

### Problema: Email non arriva
- **Verifica** che la chiave API sia configurata correttamente
- **Controlla** la cartella spam/junk
- **Attendi** qualche minuto (a volte c'è ritardo)

### Problema: Errore "Unauthorized"
- La chiave API è errata o scaduta
- Ricrea una nuova API Key con i permessi corretti

### Problema: Errore "Daily sending quota exceeded"
- Hai superato il limite di 100 email al giorno
- Attendi il giorno successivo o considera l'upgrade

## Email di Invito: Come Funziona

Una volta configurato, il processo sarà:

1. **Amministratore** crea nuovo utente nel sistema
2. **Sistema** genera automaticamente un link di invito
3. **SendGrid** invia email all'utente con il link
4. **Utente** clicca il link e imposta la sua password
5. **Utente** può accedere al sistema

## Sicurezza

- **Mai condividere** la chiave API
- **Non inserirla** nel codice sorgente
- **Usa sempre** le variabili d'ambiente
- **Rigenera** la chiave se compromessa

## Supporto

Per problemi con SendGrid:
- **Documentazione**: [https://docs.sendgrid.com](https://docs.sendgrid.com)
- **Supporto**: dashboard.sendgrid.com → Support

Per problemi con il sistema PC Manager:
- Contatta l'amministratore di sistema

---

**Nota**: Questa configurazione è necessaria solo una volta. Una volta impostata, il sistema invierà automaticamente le email di invito per tutti i nuovi utenti.