# BANK OF ARIEN – Premium Next-Gen Mock Banking App

**BANK OF ARIEN** ist eine anspruchsvolle, voll-funktionsfähige, komplexe Banking-Web-Applikation im modernen **Liquid-Glass / Glassmorphism** Design. Sie simuliert reale Bankenfunktionen mit robusten Sicherheitsstandards und einem eigenständigen Admin-Portal.

**HINWEIS:** Es handelt sich um Spielgeld/Fake-Money. Keine echten Zahlungsverbindungen, keine echten Gelder. Nur zu Simulationszwecken!

---

## 🚀 Features

### 👤 Kunden-Bereich
- **Modernes Landing-Page-Design:** Übersicht der Kontopläne, Liquid-Glass Panels und animierte CTAs.
- **Onboarding (Fake-KYC):** Zuweisung einer eindeutigen DE-IBAN pro Girokonto, Startguthaben-Bonus, Welcome-Ticket und automatische Generierung virtueller Debitkarten.
- **Geld senden (P2P):** Sichere Echtzeit-Überweisungen per IBAN, Username oder Usertag, abgesichert mit 4-stelliger Sicherheits-PIN.
- **Daueraufträge:** Wiederkehrende wöchentliche oder monatliche Aufträge erstellen, ansehen und löschen.
- **Sparbücher & Sparziele:** Einzahlungen auf Sparkonten zur Verzinsung (simuliert mit 2,5% p.a.).
- **Kredite & Tilgung:** Kreditrechner zur Bestimmung monatlicher Raten je nach Kontoplan, bequeme Beantragung (erfordert Admin-Genehmigung).
- **Statistiken & Budgets:** Grafische Visualisierung aller Einnahmen/Ausgaben via Recharts (Bar/Pie) und automatische Budgetwarnungen bei Überschreitung.
- **Kontoauszug-Export:** Professioneller Kontoauszug-Export als PDF (inklusive offiziellem Design) via `jsPDF`.
- **Support-Tickets:** Dialogkanal mit der Bank. Anfragen erstellen und Antworten einsehen.
- **Benachrichtigungen:** Echtzeit-Updates über Geldeingänge und Systemänderungen.
- **Pläne-Upgrade:** Upgrade-Modell (Free / Premium / Elite) mit geänderten Limits und Vorteilen.

### 👑 HQ Admin-Dashboard (Vollkommen unabhängig von Clerk)
- **Separater Bereich:** Erreichbar über `/admin/login` mit eigenständigen Anmeldedaten (`admin_users` Tabelle).
- **Session-Sicherheit:** Signiertes, sicheres, HTTP-only Cookie (`jose` JWT).
- **Echtzeit-Statistiken:** Anzahl Kunden im System, Gesamtguthaben aller Konten, System-Transaktionen.
- **Kundenliste & Suche:** Suchen nach E-Mail, Username, Usertag oder IBAN.
- **Kunden-Detail-Ansicht:**
  - Übersicht aller Konten, Salden und Karten des Kunden.
  - **Sperren/Entsperren (Fraud Lock):** Kundenkonten einfrieren oder freigeben.
  - **Plan manuell ändern:** Upgrades auf Premium oder Elite freischalten.
  - **BANK OF ARIEN Direktzahlung:** Geld direkt aus dem Bank-System an das Konto des Kunden senden (z.B. für Zinszahlungen, Erstattungen).
- **Support-Tickets-Verwaltung:** Beantworten offener Tickets (Kunde erhält Antwort sofort).
- **Kreditanträge bewilligen:** Kreditanträge prüfen, genehmigen (automatischer Geld-Payout) oder ablehnen.
- **HQ Audit Logs:** Lückenlose Protokollierung aller administrativen Aktivitäten zur Revisionssicherheit.

---

## 🛠 Tech-Stack

- **Framework:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Kunden-Authentifizierung:** Clerk (`@clerk/nextjs`)
- **Admin-Authentifizierung:** Custom Signed JWT Cookies (`jose`, `bcryptjs`)
- **Datenbank:** Supabase (Postgres)
- **Sicherheits-Architektur:** Server-Side API Handler (`/api/db/*` und `/admin/api/*`) unter Verwendung des Supabase Service-Roles zur vollständigen Absicherung gegen RLS-Umgehungen.
- **Charts:** Recharts
- **PDF-Generierung:** jsPDF & jspdf-autotable

---

## ⚙️ Umgebungsvariablen (.env.local)

Erstellen Sie eine `.env.local` Datei im Hauptverzeichnis mit folgenden Keys:

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Supabase Postgres
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin JWT Crypt Key
ADMIN_JWT_SECRET=super_secret_admin_jwt_key_of_arien_bank_2026
```

---

## 🗄️ Supabase-Datenbankschema (Setup)

Kopieren Sie den Inhalt der Datei `schema.sql` und führen Sie ihn im **SQL Editor** Ihres Supabase-Projekts aus.

Dieser SQL-Befehl erstellt:
1. Alle notwendigen Tabellen (`users`, `accounts`, `transactions`, `standing_orders`, `loans`, `cards`, `support_tickets`, `notifications`, `admin_users`, `admin_audit_log`).
2. Atomare, threadsichere Postgres-Funktionen (`transfer_money` und `admin_send_money`) zur Durchführung sicherer, negationsgeschützter Buchungen.
3. Row-Level Security (RLS) Richtlinien für alle Tabellen.

---

## 🧪 Seeding & Start

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Administrator-Konto anlegen
Führen Sie das Seed-Skript aus, um das Standard-Administratorkonto in Ihrer Datenbank zu registrieren:
```bash
node seed.js
```
- **Benutzername:** `admin`
- **Passwort:** `BankOfArienAdmin2026!`

*(Sie können dieses Kennwort und den Namen in der `seed.js` Datei anpassen.)*

### 3. Entwicklungsserver starten
```bash
npm run dev
```
Rufen Sie `http://localhost:3000` auf, um die BANK OF ARIEN live zu testen!
Mitarbeiter-Bereich: `http://localhost:3000/admin/login`

---
Entwickelt von **Senior Full-Stack-Entwickler Jules**.
