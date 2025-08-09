# 🚀 Deploy Beam con Supabase Edge Functions

Guida completa per il deploy dell'app Beam usando **solo Supabase** (database + backend) e **Vercel** (frontend).

## 🎯 **Vantaggi di questa soluzione:**

✅ **Completamente gratuito** - Nessun costo per Railway o altri servizi  
✅ **Tutto in un posto** - Database, autenticazione e API in Supabase  
✅ **Edge Functions** - Backend serverless veloce e scalabile  
✅ **Semplice da gestire** - Un solo dashboard per tutto  

## 📋 **Prerequisiti:**

- Account GitHub
- Account Vercel (gratuito)
- Account Supabase (gratuito)

## 🗄️ **1. Setup Supabase**

### 1.1 Crea il progetto
1. Vai su [supabase.com](https://supabase.com)
2. Clicca "New Project"
3. Nome: `beam-app`
4. Password database: scegli una password sicura
5. Regione: seleziona la più vicina
6. Clicca "Create new project"

### 1.2 Configura il database
1. Vai nel **SQL Editor**
2. Copia tutto il contenuto di `backend/supabase-schema.sql`
3. Incolla e clicca "Run"
4. Verifica che le tabelle siano create

### 1.3 Copia le credenziali
1. Vai in **Settings** → **API**
2. Copia:
   - **Project URL** (es: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** (Anon Key)
   - **service_role** (Service Role Key)

## ⚙️ **2. Deploy Edge Functions**

### 2.1 Installa Supabase CLI
```bash
npm install -g supabase
```

### 2.2 Login e inizializza
```bash
supabase login
cd tasky-app
supabase init
```

### 2.3 Link al progetto remoto
```bash
supabase link --project-ref [PROJECT_REF]
# PROJECT_REF è la parte dopo "supabase.co" nell'URL
```

### 2.4 Deploy delle Edge Functions
```bash
supabase functions deploy
```

### 2.5 Configura le variabili d'ambiente
1. Vai su **Settings** → **Edge Functions** nel dashboard Supabase
2. Aggiungi per ogni funzione:
   ```
   SUPABASE_URL = [Project URL]
   SUPABASE_SERVICE_ROLE_KEY = [Service Role Key]
   ```

## 🖥️ **3. Deploy Frontend su Vercel**

### 3.1 Collega il repository
1. Vai su [vercel.com](https://vercel.com)
2. Clicca "New Project"
3. Importa il repository GitHub di Beam
4. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `tasky-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.2 Configura le variabili d'ambiente
1. Vai in **Settings** → **Environment Variables**
2. Aggiungi:
   ```
   VITE_SUPABASE_URL = [Project URL di Supabase]
   VITE_SUPABASE_ANON_KEY = [Anon Key di Supabase]
   ```

### 3.3 Deploy
1. Clicca "Deploy"
2. Aspetta il completamento
3. Copia l'URL generato

## 🔗 **4. Test e Collegamento**

### 4.1 Test delle Edge Functions
```bash
# Test auth
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test tasks
curl -X GET https://[PROJECT_REF].supabase.co/functions/v1/tasks/tasks \
  -H "Authorization: Bearer [JWT_TOKEN]"
```

### 4.2 Test Frontend
1. Vai sull'URL Vercel
2. Prova la registrazione/login
3. Testa la creazione di task

## 🚨 **5. Troubleshooting**

### **Edge Functions non funzionano:**
- Verifica che siano deployate: `supabase functions list`
- Controlla i log: `supabase functions logs`
- Verifica le variabili d'ambiente

### **Frontend non si connette:**
- Controlla `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Verifica che le Edge Functions siano attive
- Controlla la console del browser per errori

### **Errori di autenticazione:**
- Verifica che le tabelle siano create
- Controlla le politiche RLS in Supabase
- Verifica i log delle Edge Functions

## 📊 **6. Monitoraggio**

### **Supabase Dashboard:**
- **Database**: Query e performance
- **Auth**: Utenti e sessioni
- **Edge Functions**: Log e metriche
- **Logs**: Errori e attività

### **Vercel Analytics:**
- **Performance**: Core Web Vitals
- **Traffico**: Visite e pagine
- **Errori**: 404 e crash

## 🎯 **7. Prossimi Passi**

### **Dominio personalizzato:**
1. Compra un dominio
2. Configura DNS per Vercel
3. SSL automatico

### **Monitoraggio avanzato:**
1. Integra Sentry per errori
2. Google Analytics
3. Notifiche email

### **Backup e sicurezza:**
1. Backup automatici Supabase
2. Politiche RLS avanzate
3. Audit log

## 📞 **Supporto**

- **GitHub Issues**: Bug e feature requests
- **Supabase Discord**: Database e Edge Functions
- **Vercel Support**: Frontend e deploy

---

## 🎉 **Risultato Finale:**

✅ **Frontend**: Deployato su Vercel con URL pubblico  
✅ **Backend**: Edge Functions su Supabase  
✅ **Database**: PostgreSQL gestito da Supabase  
✅ **Autenticazione**: Sistema completo Supabase Auth  
✅ **API**: RESTful API tramite Edge Functions  
✅ **Costo**: **COMPLETAMENTE GRATUITO**  

**Beam è ora live e pronto per essere utilizzato!** 🚀

---

## 🔧 **Comandi Utili:**

```bash
# Deploy Edge Functions
supabase functions deploy

# Log Edge Functions
supabase functions logs

# Status progetto
supabase status

# Reset locale
supabase db reset

# Genera tipi TypeScript
supabase gen types typescript --local > types.ts
```
