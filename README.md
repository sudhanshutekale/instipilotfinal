# 🎓 InstiPilot — AI-Powered Institute Operations Copilot

> **Hackathon Track: PS1 — Institute Operations Copilot**  
> *Role-aware AI copilot for training institutes. Built for Next.js 14, Vercel Serverless, and Supabase PostgreSQL.*

---

## ⚡ Executive Summary

Training institutes and coaching centres lose revenue, student retention, and trainer trust because operations live across disjointed silos:
* Trainer schedules clash silently
* Students drop off due to unattended absences
* EMIs slip past their due dates
* Class recordings are scattered across unorganized drives
* Sensitive fee margins are exposed to unauthorized staff

**InstiPilot** solves this by putting a **Role-Aware AI Operations Copilot** at the center of institute management, fortified with **Zero-Trust SQL Sandboxing**, **Multi-Source Attendance Reconciliation**, **Automated WhatsApp Outbox queues**, and **Instant PDF Certificate Generation**.

---

## 🌟 Key Pillars & Features

### 1. 🤖 Context-Aware AI Operations Copilot (`Ctrl+K`)
* **Natural Language to Safe SQL**: Ask complex operational questions in plain English (*"Which students missed 3 classes in Java and have pending EMI?"*, *"Show trainer workload for Vikram this week"*).
* **Resilient Intelligence**: Built-in Google Gemini 1.5 Flash support with smart structured fallback when API key is not present.
* **Proactive Action Proposals**: The copilot doesn't just display data; it generates pre-formatted WhatsApp recovery messages queued directly into the approval outbox.

### 2. 🛡️ Military-Grade Zero-Trust RBAC & Prompt Injection Guard
* **Role-Based Table & Column Censoring**:
  * **Institute Owner**: Unrestricted cross-functional visibility.
  * **Academic Counselor**: Access to attendance, dropout risk, and student contact info; financial ledger access blocked.
  * **Trainer**: Pedagogical data only (batches, recordings, attendance); fee tables and salary figures strictly forbidden.
  * **Accounts / Finance**: Fee structures, EMI tracking, bank reconciliation; biometric logs blocked.
  * **Student**: Self-portal with fee schedule, direct UPI payment proof upload, attendance stats, and certificate downloads.
* **Prompt Injection Defense**: Strips and blocks SQL comments (`--`, `/* */`), multiple statements (`DROP TABLE`, `UPDATE`, `;`), and destructive mutations.
* **Immutable Audit Trail**: Every AI query, role context, SQL string, execution duration, and blocked violation is recorded.

### 3. 📅 Intelligent Timetable & Clash Detection
* **Real-time Conflict Detection**: Automatically highlights double-booked trainers or room overlapping across Morning, Afternoon, and Evening batches.
* **Conflict Cards**: Direct visual indicators with severity levels (`Room Overlap`, `Trainer Double-Booked`).

### 4. 📲 Human-in-the-Loop WhatsApp Outbox
* **Zero Accidental Sends**: AI generates drafts with student-tailored context, but humans review and approve before dispatch.
* **Direct `wa.me` Deep-Linking**: One-click opening into WhatsApp Web / Desktop with populated, polite templates.

### 5. 🔍 Multi-Source Attendance & Bank Reconciliation
* **Hybrid Attendance Diffing**: Compares biometric fingerprint machine logs with Zoom/Google Meet online attendance to detect proxy attendance or technical dropouts.
* **Smart Bank Statement Matcher**: Automated reconciliation between UPI/NEFT transaction UTRs and student pending EMIs with Director/Owner approval workflows.

### 6. 📜 Instant PDF Certificate Generation
* **Built-in PDF Engine (`pdf-lib`)**: One-click professional vector certificate generation with unique verification hashes (`INSTP-...`), issuing authority, and cryptographic layout.

---

## 👥 Demo Personas (Instant Switcher in Navbar)

InstiPilot includes built-in one-click demo personas to test role-based access control:

| Persona | Name | Role | Primary Responsibility & Permissions |
|---|---|---|---|
| 👑 **Owner** | Priya Sharma | `owner` | Master Admin — Full operational and financial visibility. |
| 🧑‍🏫 **Trainer** | Vikram Malhotra | `trainer` | Batches, recordings, and attendance only. **Fees are blocked.** |
| 🎯 **Counselor** | Rajesh Rao | `counselor` | Student success, attendance alerts, retention outbox. |
| 💼 **Accounts** | Neha Joshi | `accounts` | Fee plans, bank reconciliation, receipts, EMI tracking. |
| 🎓 **Student** | Aarav Sharma | `student` | My Portal — Installments, receipts, proof upload, certificates. |

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Framer Motion
* **Database**: Supabase PostgreSQL (Cloud serverless database)
* **LLM Engine**: Google Gemini API (`@google/generative-ai`) with intelligent fallback
* **PDF Generation**: `pdf-lib` vector rendering engine
* **Deployment**: Vercel (Edge & Serverless Next.js Functions)

---

## 🚀 Deployment Guide (Vercel + Supabase)

### 1. Database Setup (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase project dashboard.
3. Copy and run the schema setup (all tables: `users`, `rooms`, `trainers`, `courses`, `batches`, `students`, `enrollments`, `fee_plans`, `emi_installments`, `payments`, `payment_proofs`, `attendance`, `assignments`, `submissions`, `recordings`, `timetable_slots`, `messages_outbox`, `audit_log`).
4. Copy your **Project URL** and **API Keys** (`anon` public key & `service_role` secret key) from **Project Settings → API**.

### 2. Environment Variables
Configure the following in your local `.env.local` or directly in the **Vercel Project Settings → Environment Variables**:

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Anon/Public Key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key | `eyJhbGci...` |
| `GEMINI_API_KEY` | Google Gemini API Key (optional) | `AIzaSy...` |

### 3. Deploy to Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com/new).
2. Framework Preset: **Next.js** (auto-detected).
3. Add the environment variables listed above.
4. Click **Deploy**.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

*Built with precision for institute managers, trainers, counselors, and accountants.*
