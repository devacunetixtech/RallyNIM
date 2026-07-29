# RallyNIM Production Implementation Plan

This document serves as the comprehensive implementation blueprint for building **RallyNIM** into production. It addresses all aspects of the product requirements document (PRD), spanning frontend architecture, backend services, database design, wallet integration, security controls, and deployment pipelines.

---

## 1. Project Directory Structure
A feature-based frontend architecture and a Clean Architecture backend structure are defined below:

```text
RallyNIM/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── public/
│   │   ├── favicon.ico
│   │   └── assets/               # Brand logos and icons
│   ├── src/
│   │   ├── app/                  # Application initialization
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── config/               # Environment and global variables
│   │   │   └── index.ts
│   │   ├── constants/            # Constant definitions and maps
│   │   │   └── index.ts
│   │   ├── styles/               # Global CSS & Tailwind imports
│   │   │   └── index.css
│   │   ├── types/                # Shared global TypeScript types
│   │   │   └── index.ts
│   │   ├── components/           # Generic shared UI component library
│   │   │   ├── common/           # Buttons, Loaders, Modals
│   │   │   ├── layout/           # BottomNavigation, PageHeader
│   │   │   └── ui/               # Cards, Dialogs, Badges
│   │   ├── features/             # Feature-based modular directories
│   │   │   ├── auth/             # Connect Wallet, Signature Verification
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   └── state/
│   │   │   ├── campaigns/        # Campaigns List, Creation Wizard, Details
│   │   │   ├── rewards/          # Claim workflows, Leaderboards
│   │   │   ├── passport/         # Attendance Streaks, Badges, Earned History
│   │   │   ├── templates/        # Campaign Template Selector
│   │   │   └── analytics/        # Real-time Organiser Charts & Metrics
│   │   ├── hooks/                # Global generic React hooks
│   │   │   └── useQrScanner.ts
│   │   ├── lib/                  # Library initializations
│   │   │   ├── api.ts            # Axios Client configuration
│   │   │   └── nimiq.ts          # Nimiq Mini App SDK wrapper
│   │   ├── routes/               # Routing tables and page maps
│   │   │   └── index.tsx
│   │   └── store/                # Global state stores (Zustand)
│   │       ├── useAuthStore.ts
│   │       └── useThemeStore.ts
│   ├── index.html
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/               # Env variables, database configurations, SDK keys
│   │   │   ├── database.ts
│   │   │   └── environment.ts
│   │   ├── controllers/          # HTTP request handlers (No business logic)
│   │   │   ├── auth.controller.ts
│   │   │   ├── campaign.controller.ts
│   │   │   └── claim.controller.ts
│   │   ├── services/             # Core business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── campaign.service.ts
│   │   │   ├── reward.service.ts
│   │   │   ├── qr.service.ts
│   │   │   └── nimiq.service.ts
│   │   ├── repositories/         # Database persistence layers
│   │   │   ├── user.repository.ts
│   │   │   ├── campaign.repository.ts
│   │   │   └── claim.repository.ts
│   │   ├── models/               # Mongoose Schema Definitions
│   │   │   ├── User.ts
│   │   │   ├── Campaign.ts
│   │   │   ├── Stage.ts
│   │   │   ├── Claim.ts
│   │   │   ├── Transaction.ts
│   │   │   └── Passport.ts
│   │   ├── middleware/           # Access token checks, error catchers, rate limits
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rateLimiter.middleware.ts
│   │   ├── validators/           # Zod validation schemas
│   │   │   └── campaign.validator.ts
│   │   ├── utils/                # Loggers, cryptography helpers
│   │   │   ├── logger.ts
│   │   │   └── qr.ts
│   │   ├── app.ts                # Express application bootstrap
│   │   └── server.ts             # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
```

---

## 2. Database Schema (MongoDB & Mongoose)
The schemas represent the persistent structure for RallyNIM. Indexes are configured on high-query paths (`walletAddress`, `campaignId`, `status`) to ensure scale.

```typescript
// backend/src/models/User.ts
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  username?: string;
  avatar?: string;
  bio?: string;
  role: 'organizer' | 'participant' | 'sponsor' | 'merchant';
  passportId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  walletAddress: { type: String, required: true, unique: true, index: true, lowercase: true },
  username: { type: String, trim: true },
  avatar: { type: String },
  bio: { type: String },
  role: { type: String, enum: ['organizer', 'participant', 'sponsor', 'merchant'], default: 'participant' },
  passportId: { type: Schema.Types.ObjectId, ref: 'Passport' }
}, { timestamps: true });

export const User = model<IUser>('User', UserSchema);
```

```typescript
// backend/src/models/Campaign.ts
import { Schema, model, Document } from 'mongoose';

export interface ICampaign extends Document {
  title: string;
  description: string;
  banner?: string;
  category: string;
  organizer: Schema.Types.ObjectId;
  rewardPool: number;       // In NIM
  remainingPool: number;    // In NIM
  status: 'draft' | 'scheduled' | 'live' | 'paused' | 'completed' | 'archived' | 'cancelled';
  visibility: 'public' | 'private';
  startDate: Date;
  endDate: Date;
  location: string;
  participants: Schema.Types.ObjectId[];
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  banner: { type: String },
  category: { type: String, required: true, index: true },
  organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rewardPool: { type: Number, required: true, min: 0 },
  remainingPool: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'scheduled', 'live', 'paused', 'completed', 'archived', 'cancelled'], 
    default: 'draft',
    index: true
  },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String, required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  templateId: { type: String }
}, { timestamps: true });

export const Campaign = model<ICampaign>('Campaign', CampaignSchema);
```

```typescript
// backend/src/models/Stage.ts
import { Schema, model, Document } from 'mongoose';

export interface IStage extends Document {
  campaignId: Schema.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  rewardType: 'fixed' | 'random' | 'leaderboard' | 'milestone' | 'lottery';
  rewardAmount: number; // For fixed, or average/base for other types
  verificationMethod: 'static_qr' | 'dynamic_qr' | 'hidden_qr' | 'sponsor_qr' | 'merchant_qr' | 'personal_qr' | 'quiz' | 'secret_code';
  status: 'locked' | 'upcoming' | 'active' | 'completed' | 'expired';
  maximumClaims: number;
  claimed: number;
  startsAt: Date;
  endsAt: Date;
  quizData?: {
    question: string;
    options: string[];
    correctAnswerIndex: number;
  }[];
}

const StageSchema = new Schema<IStage>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, required: true },
  rewardType: { 
    type: String, 
    enum: ['fixed', 'random', 'leaderboard', 'milestone', 'lottery'], 
    required: true 
  },
  rewardAmount: { type: Number, required: true, min: 0 },
  verificationMethod: { 
    type: String, 
    enum: ['static_qr', 'dynamic_qr', 'hidden_qr', 'sponsor_qr', 'merchant_qr', 'personal_qr', 'quiz', 'secret_code'], 
    required: true 
  },
  status: { type: String, enum: ['locked', 'upcoming', 'active', 'completed', 'expired'], default: 'locked' },
  maximumClaims: { type: Number, required: true },
  claimed: { type: Number, default: 0 },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  quizData: [{
    question: { type: String },
    options: [{ type: String }],
    correctAnswerIndex: { type: Number }
  }]
});

// Compound index to ensure uniqueness of stage orders inside a single campaign
StageSchema.index({ campaignId: 1, order: 1 }, { unique: true });

export const Stage = model<IStage>('Stage', StageSchema);
```

```typescript
// backend/src/models/Claim.ts
import { Schema, model, Document } from 'mongoose';

export interface IClaim extends Document {
  campaignId: Schema.Types.ObjectId;
  stageId: Schema.Types.ObjectId;
  walletAddress: string;
  reward: number; // Claimed amount in NIM
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  claimedAt: Date;
}

const ClaimSchema = new Schema<IClaim>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  stageId: { type: Schema.Types.ObjectId, ref: 'Stage', required: true, index: true },
  walletAddress: { type: String, required: true, lowercase: true, index: true },
  reward: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending', index: true },
  transactionHash: { type: String },
  claimedAt: { type: Date, default: Date.now }
});

// Prevent duplicate claims by a wallet for the same stage
ClaimSchema.index({ stageId: 1, walletAddress: 1 }, { unique: true });

export const Claim = model<IClaim>('Claim', ClaimSchema);
```

```typescript
// backend/src/models/Passport.ts
import { Schema, model, Document } from 'mongoose';

export interface IPassport extends Document {
  walletAddress: string;
  eventsAttended: Schema.Types.ObjectId[]; // Campaign IDs
  campaignsCompleted: Schema.Types.ObjectId[];
  totalNIMEarned: number;
  badges: string[];
  achievements: {
    title: string;
    unlockedAt: Date;
    description: string;
  }[];
  streak: number; // consecutive active days
  leaderboardRank?: number;
}

const PassportSchema = new Schema<IPassport>({
  walletAddress: { type: String, required: true, unique: true, index: true, lowercase: true },
  eventsAttended: [{ type: Schema.Types.ObjectId, ref: 'Campaign' }],
  campaignsCompleted: [{ type: Schema.Types.ObjectId, ref: 'Campaign' }],
  totalNIMEarned: { type: Number, default: 0, min: 0 },
  badges: [{ type: String }],
  achievements: [{
    title: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
    description: { type: String, required: true }
  }],
  streak: { type: Number, default: 0 },
  leaderboardRank: { type: Number }
});

export const Passport = model<IPassport>('Passport', PassportSchema);
```

```typescript
// backend/src/models/Transaction.ts
import { Schema, model, Document } from 'mongoose';

export interface ITransaction extends Document {
  walletAddress: string;
  campaignId?: Schema.Types.ObjectId;
  amount: number;
  type: 'funding' | 'payout' | 'refund';
  status: 'pending' | 'success' | 'failed';
  network: 'testnet' | 'mainnet';
  transactionHash: string;
  timestamp: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  walletAddress: { type: String, required: true, lowercase: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', index: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['funding', 'payout', 'refund'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending', index: true },
  network: { type: String, enum: ['testnet', 'mainnet'], required: true },
  transactionHash: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now }
});

export const Transaction = model<ITransaction>('Transaction', TransactionSchema);
```

---

## 3. Express Backend & API Endpoints
All API calls must begin with `/api/v1` and handle JSON payloads securely.

### Authentication Endpoints
- `POST /api/v1/auth/connect`
  - **Body**: `{ walletAddress: string }`
  - **Output**: `{ nonce: string }` (Cryptographic salt generated backend-side and stored in temporary Redis cache / short-lived session with an expiry of 5 minutes).
- `POST /api/v1/auth/verify`
  - **Body**: `{ walletAddress: string, signature: string }`
  - **Logic**: Verifies signature against the generated nonce for the address.
  - **Output**: `{ accessToken: string, user: IUser }` plus sets `refreshToken` inside a secure HTTPOnly, SameSite=Strict cookie.
- `POST /api/v1/auth/refresh`
  - **Logic**: Reads refresh token from HTTPOnly cookie, validates expiry, issues a new JWT and rotates the refresh token.
- `POST /api/v1/auth/logout`
  - **Logic**: Clears session, revokes refresh token in DB, deletes client-side cookies.
- `GET /api/v1/auth/me`
  - **Headers**: `Authorization: Bearer <token>`
  - **Output**: `{ user: IUser, passport: IPassport }`

### Campaign Endpoints
- `GET /api/v1/campaigns`
  - **Parameters**: `category`, `status`, `page`, `limit` (Public access, filterable).
- `GET /api/v1/campaign/:id`
  - **Output**: Complete campaign details, including public active/upcoming stages.
- `POST /api/v1/campaign`
  - **Headers**: `Authorization: Bearer <token>` (Requires `'organizer'` role check middleware).
  - **Body**: `{ title, description, category, rewardPool, startDate, endDate, location, stages: [...] }`
  - **Output**: `{ campaign: ICampaign, stages: IStage[] }` (Initial state: `'draft'`).
- `PUT /api/v1/campaign/:id`
  - **Logic**: Updates fields if campaign status is `'draft'` or `'scheduled'`. Modifying live campaigns is locked to prevent budget discrepancies.
- `POST /api/v1/campaign/:id/publish`
  - **Logic**: Verifies funding transaction, checks matching balances, and moves status to `'live'`.
- `POST /api/v1/campaign/:id/pause` / `POST /api/v1/campaign/:id/resume`
  - **Logic**: Toggles campaign activity during emergencies.

### Claim & Reward Endpoints
- `POST /api/v1/reward/claim`
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ campaignId, stageId, verificationData }`
  - **Verification Types**:
    - `dynamic_qr`: Verification data contains a signed, time-locked token. Backend decrypts, validates timestamp, checks sign signature, and marks QR as consumed.
    - `quiz`: Verification data includes answer indices. Backend matches answers.
    - `secret_code`: Checks string hash.
  - **Logic**:
    1. Verifies rules (Campaign is live, stage active, remaining budget, not yet claimed by wallet).
    2. Runs database transactions to increment `claimed` counters on the Stage and decrement `remainingPool` on the Campaign.
    3. Triggers asynchronous Nimiq payout transfer.
    4. Records pending Claim entry.
  - **Output**: `{ status: 'pending' | 'success', claimId: string }`
- `GET /api/v1/reward/history`
  - **Output**: List of claimed stages, earnings, and transaction hashes for the authenticated wallet.

### Passport & Analytics Endpoints
- `GET /api/v1/passport/:walletAddress`
  - **Output**: Public Event Passport (badges, achievements, total earnings, active streaks).
- `GET /api/v1/analytics/campaign/:id`
  - **Output**: Real-time stats (Daily check-ins, total claims, rewards remaining, completion percentages).

---

## 4. Wallet & Blockchain Integration (Nimiq Mini App SDK)

RallyNIM connects using the Nimiq Mini App SDK inside Nimiq Pay.

### Service Layer Implementation
A unified wrapper abstracts the SDK interactions. This allows clean toggling between Testnet and Mainnet via environments:

```typescript
// frontend/src/lib/nimiq.ts
import { MiniAppSDK } from '@nimiq/mini-app-sdk'; // Assuming SDK import path

export interface INimiqWalletService {
  connect(): Promise<string>;
  getAccount(): Promise<string | null>;
  signMessage(message: string): Promise<string>;
  sendTransaction(recipient: string, amountInNIM: number, data?: string): Promise<string>;
  getBalance(): Promise<number>;
}

class NimiqWalletService implements INimiqWalletService {
  private sdk: typeof MiniAppSDK | null = null;
  private activeAddress: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Lazy load SDK to support server-side rendering boundaries
      this.sdk = MiniAppSDK.getInstance();
    }
  }

  async connect(): Promise<string> {
    if (!this.sdk) throw new Error('Nimiq SDK not initialized');
    const account = await this.sdk.requestAddress();
    this.activeAddress = account.address;
    return account.address;
  }

  async getAccount(): Promise<string | null> {
    return this.activeAddress;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.sdk) throw new Error('Nimiq SDK not initialized');
    if (!this.activeAddress) throw new Error('Wallet not connected');
    
    const signatureResult = await this.sdk.signMessage({
      message,
      address: this.activeAddress
    });
    return signatureResult.signature;
  }

  async sendTransaction(recipient: string, amountInNIM: number, data?: string): Promise<string> {
    if (!this.sdk) throw new Error('Nimiq SDK not initialized');
    if (!this.activeAddress) throw new Error('Wallet not connected');

    // Convert NIM to Luna (1 NIM = 100,000 Luna)
    const lunaAmount = amountInNIM * 100000;

    const txResult = await this.sdk.sendTransaction({
      sender: this.activeAddress,
      recipient,
      value: lunaAmount,
      fee: 0, // In Nimiq 2.0 transaction fees are optional/near-zero
      extraData: data ? new TextEncoder().encode(data) : undefined
    });

    return txResult.hash;
  }

  async getBalance(): Promise<number> {
    if (!this.sdk || !this.activeAddress) return 0;
    const accountDetails = await this.sdk.getAccountDetails(this.activeAddress);
    return accountDetails.balance / 100000; // Return in NIM
  }
}

export const nimiqWallet = new NimiqWalletService();
```

### Campaign Funding Logic
To run a reward campaign, organizers must fund the reward pool:
1. Organiser designs the campaign, inputting the total pool amount (e.g. `500 NIM`).
2. Backend returns a campaign record in `'draft'` state and specifies the **Platform Escrow Address** as the destination.
3. React UI requests the organizer to complete a transaction through `nimiqWallet.sendTransaction(ESCROW_ADDRESS, 500, campaignId)`.
4. The transaction hash is sent to the backend: `POST /api/v1/campaign/:id/publish { txHash: string }`.
5. Backend verifies the transaction via Nimiq RPC / Explorer REST API:
   - Validates that the transaction sender matches the campaign organizer's address.
   - Validates that the recipient is the designated Escrow Address.
   - Validates that the amount matches the requested `rewardPool`.
   - Validates that the transaction payload contains the target `campaignId`.
6. Once transaction is confirmed, the backend updates campaign status to `'live'`.

### Payout Execution Logic
Rewards are automated. The backend holds a secure hot wallet that broadcasts NIM payouts when a participant completes a valid stage:
1. When `POST /api/v1/reward/claim` passes all security and anti-cheat validation rules, the backend initializes the reward payout.
2. The server-side wallet signs and submits a Nimiq transaction sending `rewardAmount` (e.g., `2 NIM`) from the Escrow Wallet to the participant's `walletAddress`.
3. The transaction hash is saved in the `Claim` and `Transaction` records, status changes to `'completed'`, and the user's `Passport` earns the balance.

---

## 5. Anti-Cheat & Security Architecture

To prevent sybil attacks, location spoofing, and automated claims at real-world events, RallyNIM implements five security controls.

### 5.1 Nonce-Based Wallet Authentication
1. To log in, the user signs a message containing a cryptographically generated nonce.
2. The nonce is formatted as a human-readable text:
   `Sign this message to authenticate with RallyNIM. Nonce: [RANDOM_HEX_STRING] Timestamp: [ISO_DATE_STRING]`
3. The backend validates the signature using Nimiq cryptography libraries and verifies that the signature matches the public key/wallet address and the timestamp is under 5 minutes old to prevent replay attacks.

### 5.2 Decoupled Dynamic QR Code Engine (Time-Locked & HMAC Signed)
To prevent participants inside an event from taking a screenshot of a check-in QR code and sharing it online, RallyNIM implements dynamic QR tokens:
1. The event organiser's display terminal/presenter screen requests a dynamic token from the backend: `POST /api/v1/qr/generate { stageId: string }`.
2. The backend generates a token containing:
   - `stageId`
   - `timestamp` (current time)
   - `salt` (random string)
   - `signature`: An HMAC-SHA256 hash of the `stageId + timestamp + salt` signed using a secret key stored on the server.
3. The token is rendered as a QR code and regenerates every **20 seconds**.
4. When scanned by a participant, the mobile client sends the token to `POST /api/v1/reward/claim`.
5. The backend validates that:
   - The HMAC signature matches, ensuring the QR was generated by the platform.
   - The token's timestamp is within **30 seconds** of the current time. If it is older, it rejects the request as an expired QR code.
   - The token has not been previously claimed by any wallet (preventing reuse of the exact same token by multiple people).

### 5.3 Sybil & Fraud Mitigation Controls
- **IP Rate Limiting**: The claim endpoint is throttled using a sliding-window rate limiter (max 2 claims per 10 seconds per IP address and wallet address).
- **Wallet Age / Balance Checks**: For high-value campaigns, organisers can set filters demanding that the claiming wallet has existed on the Nimiq chain for at least 24 hours, or has a history of at least 1 previous transaction, preventing organizers' budgets from being drained by instant, programmatic burner wallets.
- **Geofencing / Coordinates Verification**: Optional coordinate checking where the mobile client sends latitude/longitude (with permission). The backend verifies that the user is within a 200-meter radius of the event location coordinates.

---

## 6. Frontend Theme & Design System

RallyNIM features a vibrant, high-end, mobile-first design using Tailwind CSS. 

### Tailwind Theme Configurations
Custom colors, typography, and animation tokens are set up inside `tailwind.config.js`:

```javascript
// frontend/tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nimiq: {
          gold: '#E0A82E',
          yellow: '#FFC107',
          blue: '#1F2538',
          dark: '#101420',
          light: '#F8F9FA'
        },
        brand: {
          primary: '#E0A82E',       // Nimiq Gold
          secondary: '#E65100',     // Deep Orange accent
          background: '#0B0D17',    // Deep slate black
          surface: '#151926',       // Semi-translucent surface
          accent: '#00B0FF'         // Cyber blue highlight
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 15px rgba(224, 168, 46, 0.4)'
      },
      backdropBlur: {
        glass: '16px'
      }
    }
  },
  plugins: []
}
```

### Global Base Styles
Custom glassmorphism classes and animations are defined in the CSS base:

```css
/* frontend/src/styles/index.css */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  body {
    @apply bg-brand-background text-slate-100 font-sans antialiased overflow-x-hidden;
  }
}

/* Glassmorphism panel utility */
.glass-panel {
  background: rgba(21, 25, 38, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

/* Golden glow borders for active states */
.glow-border {
  border: 1px solid rgba(224, 168, 46, 0.5);
  box-shadow: 0 0 10px rgba(224, 168, 46, 0.2);
}

/* Micro-animations for feedback transitions */
.click-bounce {
  transition: transform 0.1s ease;
}
.click-bounce:active {
  transform: scale(0.96);
}
```

---

## 7. Global State & Client Caching

The application handles caching and shared states via Zustand and React Query.

### Zustand Stores

```typescript
// frontend/src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  id: string;
  walletAddress: string;
  role: 'organizer' | 'participant' | 'sponsor' | 'merchant';
  username?: string;
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      clearAuth: () => set({ token: null, user: null, isAuthenticated: false })
    }),
    { name: 'rallynim-auth-storage' }
  )
);
```

### React Query Caching Strategies
We isolate UI fetching with standard configuration blocks to prevent over-fetching and support optimistic responses:

- **Stale Time**: 15 seconds for dashboard analytics (requiring near real-time updates). 5 minutes for passive campaign list views and event passport profiles.
- **Optimistic Updates**: When a participant claims a reward, the React Query mutation immediately updates the local `Event Passport` total balance and marks the stage as claimed before the backend transaction completes, falling back if the transaction fails.

---

## 8. Step-by-Step Implementation Phases

The building schedule is structured into 4 sequential phases spanning a single 24-hour day:

### Phase 1: Foundation & Infrastructure (Hours 00:00 – 06:00)
- **Task 1.1**: Initialize git repository, configure backend and frontend workspace configurations, and set up linters and formatters.
- **Task 1.2**: Provision MongoDB Atlas Cluster and configure developer access keys.
- **Task 1.3**: Deploy the backend and frontend boilerplate projects to Render and Vercel. Connect environment pipelines to check the CI/CD pipeline early.
- **Task 1.4**: Define backend TypeScript configurations and implement Mongoose models with validation hooks.

### Phase 2: Core Engine & SDK Integration (Hours 06:00 – 12:00)
- **Task 2.1**: Integrate Nimiq Mini App SDK and build the client-side `WalletService` layer.
- **Task 2.2**: Build backend signature verification routes (`POST /auth/connect`, `POST /auth/verify`) and JWT issue logic.
- **Task 2.3**: Build the Campaign Manager service, implementing campaign templates and the stage builder.
- **Task 2.4**: Implement the Campaign Funding engine. Construct client-side payment triggers and server-side RPC validation filters.
- **Task 2.5**: Set up the Hot Wallet on the backend using the Nimiq JS library to handle automated payout requests.

### Phase 3: Claim Logic & Security Engine (Hours 12:00 – 18:00)
- **Task 3.1**: Build the QR engine, implementing the dynamic HMAC-SHA256 generation loop.
- **Task 3.2**: Write the QR scanner UI using the `html5-qrcode` library, ensuring camera permission fallbacks.
- **Task 3.3**: Develop the `POST /reward/claim` validation pipeline (Anti-cheat, geofencing, rate limiter, double-claim check).
- **Task 3.4**: Integrate database transactions (sessions) in the backend to update pools safely.
- **Task 3.5**: Implement the Event Passport page, streak tracker, badge allocation algorithms, and achievements calculator.

### Phase 4: UI/UX & Launch Quality Polish (Hours 18:00 – 24:00)
- **Task 4.1**: Build the interactive dashboards, templates selector page, and organic organizer analytics views.
- **Task 4.2**: Standardize layouts to match Apple HIG and Material 3 guidelines. Implement global Tailwind base configuration, custom scrollbars, and dark mode.
- **Task 4.3**: Integrate Framer Motion micro-animations on all button hover/click states, scanner visual cues, and card expansions.
- **Task 4.4**: Conduct comprehensive validation across all 59 PRD criteria. Remove debugger statements and verify mobile viewport responses.
- **Task 4.5**: record the competition submission walkthrough, and publish the GitHub repo.

---

## 9. Launch & Migration Checklist
Before deploying the application for public access, verify the following steps:

### Network & Config Check
- [ ] Environment variable `NETWORK` matches standard target (`testnet` for staging, `mainnet` for live launch).
- [ ] Explorer links correctly map base URL routes (`explorer.nimiq.com` or `test.nimiq.com`).
- [ ] Escrow wallet key pairs are backed up in cold storage and not committed to repository history.
- [ ] Hot wallet balance has sufficient NIM reserves to cover initial claim payouts.

### Database & System Performance Check
- [ ] MongoDB indexes match active fields (`walletAddress_1`, `campaignId_1`, `status_1`).
- [ ] Rate limits are active on authentication and claiming routes.
- [ ] Mongoose reconnect options and connections limits are validated against MongoDB Atlas quotas.
- [ ] Winston logging output streams successfully to standard outputs without displaying sensitive user keys.

### UI/UX Final Check
- [ ] Onboarding flow completes under 60 seconds inside Nimiq WebView.
- [ ] Scanner is verified on iOS and Android devices, fallback warning is shown when camera permissions are denied.
- [ ] Page bottom navigations remain sticky and within thumb reach on small displays.
- [ ] No empty states look unpolished; standard error pages are responsive.

---

## 10. Win Strategy: Feature-to-Judging Rubric Mapping
To optimize RallyNIM for the competition's 105 points:

1. **Design & UX (25 Points)**: The frontend features a sleek, dark-themed user interface, complete with subtle glassmorphic elements and CSS micro-animations. Onboarding is simplified to a single-click wallet connection.
2. **Functionality (25 Points)**: High-performance data caching with React Query prevents visual lags. End-to-end user actions (creating campaigns, scanning QRs, and receiving NIM payments) run smoothly.
3. **Usefulness & Originality (25 Points)**: Instead of typical single-use claim pages, the system leverages smart, preconfigured campaign templates and a persistent Event Passport that aggregates attendance logs.
4. **Marketing & Build in Public (25 Points)**: Consistent status updates will be shared online, accompanied by structured progress reports.
5. **NIM Integration Bonus (5 Points)**: NIM functions as the central mechanism, driving both organic campaign funding and attendee payouts.
