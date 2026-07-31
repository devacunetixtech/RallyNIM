# 🏁 RallyNIM

RallyNIM is a decentralized event engagement and loyalty platform built on the Nimiq blockchain. It allows event organizers to create multi-stage interactive quests (e.g., conferences, hackathons, scavenger hunts) and incentivize attendees with direct, sequence-enforced Nimiq (NIM) rewards verified through proximity (geofencing), dynamic QR codes, quizzes, and other interaction challenges.

---

## ✨ Features

- **Multi-Stage Event Campaigns:** Organizers can create sequentially-locked engagement campaigns with custom reward allocations.
- **Smart Escrow Pool:** Event funds are deposited into an escrow hot wallet on-chain, verifying payment before publishing.
- **Granular Claim Verifications:**
  - **Dynamic QR Codes:** Refreshing time-sensitive tokens scanned via a mobile device (using rear-facing camera auto-detection).
  - **Proximity Geofencing:** HTML5 Geolocation API checks attendee coordinate proximity to event venues.
  - **Quizzes & Questions:** Knowledge checks verify audience understanding before processing payouts.
- **Dynamic Time & Scheduling Constraints:** Campaigns and individual stages only activate within their specified date & time windows.
- **Organizer Dashboards:** Real-time claim statistics, manual escrow publishing fail-safes, and campaign pausing/cancelling/refund mechanisms.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, TailwindCSS, Vite, Nimiq Hub & Wallet SDK, Framer Motion, HTML5 QR Code Engine.
- **Backend:** Node.js, Express, TypeScript, Mongoose/MongoDB, Axios.
- **Blockchain Integration:** `@nimiq/core` (Albatross JSON-RPC client).

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v18+)
- MongoDB instance (Atlas or local)
- A Nimiq wallet for funding and organizer operations

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/RallyNIM.git
cd RallyNIM
```

### 2. Backend Configuration
Navigate to the `backend` folder and copy the environment template:
```bash
cd backend
cp .env.example .env  # Or create a new .env file
```

Configure your **`backend/.env`** parameters:
```env
PORT=5000
NODE_ENV=""
MONGODB_URI=""
JWT_SECRET=""
JWT_EXPIRATION=""
JWT_REFRESH_EXPIRATION=""

# Nimiq Network Configuration
NETWORK=""                               # 'mainnet' or 'testnet'
ESCROW_WALLET_ADDRESS=NQXX XXXX ...           # Escrow hot wallet public address
HOT_WALLET_PRIVATE_KEY=your_64hex_private_key # Private key used for broadcasting payouts
```

Install backend dependencies and run:
```bash
npm install
npm run dev
```

### 3. Frontend Configuration
Navigate to the `frontend` folder and create/copy the environment file:
```bash
cd ../frontend
cp .env.example .env  # Or create a new .env file
```

Configure your **`frontend/.env`** parameters:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_NETWORK=mainnet                          # 'mainnet' or 'testnet'
```

Install frontend dependencies and run:
```bash
npm install
npm run dev
```

---

## 📂 Project Architecture

```
RallyNIM/
├── backend/
│   ├── src/
│   │   ├── config/       # Environment & database configurations
│   │   ├── controllers/  # API route controllers
│   │   ├── middleware/   # JWT authentication & role checking
│   │   ├── models/       # Mongoose schemas (Campaign, Stage, Transaction, etc.)
│   │   ├── routes/       # Express route definitions
│   │   └── services/     # Core business logic (claiming, payouts, verification)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/   # Universal layout components (Header, Footer)
    │   ├── features/     # Feature-specific modules
    │   │   ├── campaigns/ # Explorer, details panel, organizer actions
    │   │   ├── passport/  # User claim history passport
    │   │   └── rewards/   # Geolocation & QR scanner logic
    │   ├── lib/          # API services & Nimiq wallet helper utils
    │   └── store/        # State store (Zustand auth management)
    └── package.json
```