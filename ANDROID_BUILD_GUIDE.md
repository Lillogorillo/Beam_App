# 📱 **GUIDA CREAZIONE APK ANDROID - BEAM APP**

## 🚀 **METODO RAPIDO CON BUBBLEWRAP**

### **STEP 1: Installazione**
```bash
npm install -g @bubblewrap/cli
```

### **STEP 2: Creazione Progetto**
```bash
mkdir beam-android && cd beam-android
bubblewrap init --manifest https://beam-app-phi.vercel.app/manifest.json
```

### **STEP 3: Risposte alle Domande Interattive**
Quando ti chiede:
- **Domain**: `beam-app-phi.vercel.app`
- **URL path**: `/` (premi Enter)
- **Name**: `Beam`
- **Launcher name**: `Beam`
- **Theme color**: `#2563eb`
- **Navigation color**: `#111827`
- **Background color**: `#111827`
- **Enable notifications**: `Y`
- **Package ID**: `com.beam.app`
- **Generate signing key**: `Y`
- **Key path**: `./beam-key.keystore` (premi Enter)
- **Key alias**: `beam-key` (premi Enter)
- **Password**: `beam123` (ricordatelo!)

### **STEP 4: Build APK**
```bash
bubblewrap build
```

---

## 🔧 **METODO ALTERNATIVO - PWA BUILDER**

### **OPZIONE 1: PWA Builder Online**
1. Vai su: https://www.pwabuilder.com/
2. Inserisci URL: `https://beam-app-phi.vercel.app`
3. Clicca "Start" → "Package For Stores"
4. Seleziona "Android" → "Generate Package"
5. Scarica il file APK generato

### **OPZIONE 2: APK Builder Online**
1. Vai su: https://appsgeyser.com/
2. Seleziona "Progressive Web App"
3. URL: `https://beam-app-phi.vercel.app`
4. Nome: `Beam`
5. Genera APK

---

## 📋 **FILE NECESSARI**

L'app è già configurata con:
- ✅ **manifest.json** ottimizzato per TWA
- ✅ **Service Worker** per PWA
- ✅ **Icone** in tutte le dimensioni
- ✅ **Asset Links** per deep linking

---

## 🎯 **RISULTATO FINALE**

Otterrai un file APK di circa **8-15MB** che:
- ✅ Funziona come app nativa Android
- ✅ Ha icona personalizzata
- ✅ Splash screen professionale  
- ✅ Notifiche push (se abilitate)
- ✅ Installabile da file APK

---

## 🔑 **FIRMA DIGITALE (Opzionale)**

Per distribuire su Google Play Store:
```bash
# Genera chiave di firma
keytool -genkey -v -keystore beam-release.keystore -alias beam -keyalg RSA -keysize 2048 -validity 10000

# Firma APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore beam-release.keystore app-release-unsigned.apk beam
```

---

## 📱 **INSTALLAZIONE SU ANDROID**

1. Abilita "Origini sconosciute" nelle impostazioni Android
2. Trasferisci il file APK sul dispositivo
3. Tocca il file APK e installa
4. L'app apparirà nel drawer delle applicazioni

**🎉 BEAM APP PRONTA PER I TUOI AMICI! 🎉**