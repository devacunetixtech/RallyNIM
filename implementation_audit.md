# RallyNIM Implementation Audit Report

This report presents a detailed audit of the **RallyNIM** codebase compared against the specifications defined in [Implementation.md](file:///home/acunetix/Desktop/RallyNIM/Implementation.md). 

---

## 1. Project Directory Structure

The planned directory structure in [Implementation.md](file:///home/acunetix/Desktop/RallyNIM/Implementation.md#L7-L97) specifies a clean, modular Clean Architecture for the backend and a feature-based structure for the frontend. The actual codebase deviates significantly:

### Frontend Structure Comparison
* **Planned**: Separate directories for components (`common/`, `layout/`, `ui/`), features (`auth/`, `campaigns/`, `rewards/`, etc.), hooks (`useQrScanner.ts`), styles (`styles/index.css`), and types.
* **Actual**: 
  * The frontend is almost entirely contained in a single monolithic file: [App.tsx](file:///home/acunetix/Desktop/RallyNIM/frontend/src/App.tsx) (~1,250 lines).
  * Global state is managed via [useAuthStore.ts](file:///home/acunetix/Desktop/RallyNIM/frontend/src/store/useAuthStore.ts), which is present.
  * Helper services for API requests ([api.ts](file:///home/acunetix/Desktop/RallyNIM/frontend/src/lib/api.ts)) and Nimiq Wallet ([nimiq.ts](file:///home/acunetix/Desktop/RallyNIM/frontend/src/lib/nimiq.ts)) are implemented as expected.
  * No modular layout components, features folders, or custom hooks exist.

### Backend Structure Comparison
* **Planned**: Separation of concerns with controllers, services, repositories (`user.repository.ts`, etc.), models, middleware, validators, and utils.
* **Actual**:
  * **Controllers & Models**: The models and controllers are fully implemented in their respective folders: `backend/src/models/` and `backend/src/controllers/`.
  * **Services**: `auth`, `campaign`, `claim`, and `qr` services exist. However, `nimiq.service.ts` and `reward.service.ts` are **missing**.
  * **Repositories**: The persistent repository layer is **missing** (Mongoose queries are executed directly inside services and controllers).
  * **Validators**: The Zod validator directory and `campaign.validator.ts` are **missing**.
  * **Middleware**: `auth.middleware.ts` exists, but `error.middleware.ts` and `rateLimiter.middleware.ts` are **missing**.
  * **Utils**: Only `crypto.ts` exists; `logger.ts` and `qr.ts` are **missing**.

---

## 2. Database Schema (Mongoose Models)
**Status: Complete & Compliant**

The Mongoose models perfectly align with the schema definitions in the plan:
* [User.ts](file:///home/acunetix/Desktop/RallyNIM/backend/src/models/User.ts)
* [Campaign.ts](file:///home/acunetix/Desktop/RallyNIM/backend/src/models/Campaign.ts)
* [Stage.ts](file:///home/acunetix/Desktop/RallyNIM/backend/src/models/Stage.ts)
* [Claim.ts](file:///home/acunetix/Desktop/RallyNIM/backend/src/models/Claim.ts)
* [Passport.ts](file:///home/acunetix/Desktop/RallyNIM/backend/src/models/Passport.ts)
* [Transaction.ts](file:///home/acunetix/Desktop/RallyNIM/backend/src/models/Transaction.ts)

All relationships, timestamps, compound indexes, and unique constraints (e.g. stage unique orders per campaign and single claims per wallet-stage pair) are correctly defined.

---

## 3. Express Backend & API Endpoints
**Status: Partially Done (Core endpoints are live, but security/auxiliary layers are stubbed or missing)**

| Endpoint | Target Implementation | Actual Status |
|---|---|---|
| `POST /api/v1/auth/connect` | Generates auth nonce | **Done** |
| `POST /api/v1/auth/verify` | Validates signature, issues JWT tokens | **Done** |
| `POST /api/v1/auth/refresh` | Decodes refresh token, rotates JWT sessions | **Done** |
| `POST /api/v1/auth/logout` | Clears sessions | **Done** |
| `GET /api/v1/auth/me` | Fetches active user & passport | **Done** |
| `GET /api/v1/campaigns` | Lists campaigns with filters | **Done** |
| `GET /api/v1/campaigns/:id` | Fetches campaign with active/upcoming stages | **Done** |
| `POST /api/v1/campaigns` | Creates draft campaign and stages | **Done** (Uses Mongoose Transaction Sessions) |
| `POST /api/v1/campaigns/:id/publish` | Verifies escrow funding, sets status to `live` | **Mocked** (`mockVerification = true` bypasses blockchain checks) |
| `POST /api/v1/campaigns/:id/pause` | Pause campaign in emergencies | **Done** |
| `POST /api/v1/campaigns/:id/resume` | Resume paused campaign | **Done** |
| `POST /api/v1/reward/claim` | Process reward payouts | **Partially Mocked** (Anti-cheat, geofencing, rate limiter, and real Hot Wallet payout signatures are missing/stubbed) |
| `GET /api/v1/reward/history` | Fetches claimed history for wallet | **Done** |
| `GET /api/v1/passport` | Fetches active passport profile | **Done** |
| `GET /api/v1/passport/:walletAddress` | Fetches public passport details | **Done** |

---

## 4. Wallet & Blockchain Integration
**Status: Mocked in Developer Mode**

* **Frontend**: The Nimiq Wallet wrapper [nimiq.ts](file:///home/acunetix/Desktop/RallyNIM/frontend/src/lib/nimiq.ts) handles detection of the `window.MiniAppSDK` when run inside Nimiq Pay. However, for local development, it falls back to generating a mock wallet address (`NQ...`) and a mock balance of `250 NIM`. 
* **Backend Escrow & hot Wallet Payouts**: 
  * The actual backend Hot Wallet signature and broadcast mechanisms using the Nimiq JS library are **missing**.
  * Dynamic transaction hash generation is mocked in the claim service using `crypto.randomUUID()` instead of sending real testnet NIM to the user's address.
  * Campaign funding verification does not execute actual RPC query checks against the Nimiq node or block explorers to verify the escrow address transaction details.

---

## 5. Anti-Cheat & Security Architecture
**Status: Partially Implemented**

* **Wallet Authentication**: Nonce-based cryptographic login is fully implemented with signature verification in [crypto.ts](file:///home/acunetix/Desktop/RallyNIM/backend/src/utils/crypto.ts) and expiry validations.
* **Dynamic QR Engine**: The token generator and validator based on HMAC-SHA256 and 30-second time-locks are successfully implemented in [qr.service.ts](file:///home/acunetix/Desktop/RallyNIM/backend/src/services/qr.service.ts).
* **IP Rate Limiting**: The package `express-rate-limit` is imported in `package.json`, but **no rate limit middleware is implemented or configured** on backend API routes.
* **Geofencing & Wallet Checks**: **Not implemented**. There are no latitude/longitude radius checks or history/balance filters.
* **QR Scanner Component**: The frontend does not contain an actual camera scanning component using libraries like `html5-qrcode`. It relies on text copy-paste input and a "Simulator Auto-Fill Token" button.

---

## 6. Frontend Theme & Design System
**Status: CSS Layout Complete, but Tailwind & Framer Motion are Missing**

* **Tailwind CSS**: Although [Implementation.md](file:///home/acunetix/Desktop/RallyNIM/Implementation.md#L528-L573) outlines a rich `tailwind.config.js` theme file, **Tailwind CSS is not installed in the frontend dependencies**, nor does the configuration file exist. The UI styling is written with basic standard CSS in [index.css](file:///home/acunetix/Desktop/RallyNIM/frontend/src/index.css) and inline React styles.
* **Animations**: `framer-motion` is **not installed or imported**. There are no rich transition states or custom expanding cards.
* **Theme Store**: The planned `useThemeStore.ts` store for managing dark/light theme state is **missing**.

---

## 7. Step-by-Step Implementation Phase Analysis

Here is a summary of the 4 building phases from [Implementation.md](file:///home/acunetix/Desktop/RallyNIM/Implementation.md#L665-L695):

1. **Phase 1 (Foundation)**: **90% Complete**. Models are done, local DB is functional. Git and dev configurations are established. Render/Vercel pipelines need to be checked.
2. **Phase 2 (Core & SDK)**: **60% Complete**. Wallet service fallback, basic JWT authentication, and campaign creation are done. The Nimiq JS hot wallet payout and the Escrow on-chain explorer checks are stubbed out.
3. **Phase 3 (Claims & Security)**: **50% Complete**. Dynamic HMAC QR backend generation/verification is implemented, as well as Mongoose session transactions. Real camera scanner frontend integration, rate limiting, and geofencing are missing.
4. **Phase 4 (UI/UX & Polish)**: **30% Complete**. A single-page dashboard prototype with tab panels is functional, but lacks the modular components, Tailwind theme parameters, Framer Motion animations, and the templates database.
