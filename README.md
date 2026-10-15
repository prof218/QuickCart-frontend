# QuickCart — Frontend

Next.js (App Router) + TypeScript + Material UI storefront for QuickCart. Talks to the
separate [`quickcart-backend`](../quickcart-backend) API. This is a standalone app meant to
live in its own Git repository.

> **Scope:** product listing, details, cart, **authentication** (login-gated purchase actions), and
> **secure Razorpay Checkout** (test mode) with an order-confirmation page.

## Checkout & payment (Razorpay test mode)
- `/checkout` (auth-guarded) collects contact details and shows the **server-calculated** amount.
- **Pay** → backend `create-order` (validates stock, computes the total in paise, creates a pending
  order + Razorpay order) → Razorpay Checkout opens (official `checkout.js`, loaded via `src/lib/razorpay.ts`).
- On success → backend `verify` (HMAC-SHA256 signature check, owner + idempotency) → **only then**
  the cart is cleared and you land on `/orders/<id>` ("Order confirmed", status `paid`).
- Failure, a failed attempt (retry stays open), and modal dismissal each show clear feedback and
  **never** a fake success. The order is marked failed only on dismissal, so retries work.
- **Test card is account-dependent** (some reject the generic Visa as "international"). The most
  reliable test-mode success is **UPI `success@razorpay`** or **Netbanking → any test bank → Success**.
  See the backend README's "Razorpay test-mode setup" for current test instruments.

## Authentication (Flipkart-style)
- **Guest browsing is open** — anyone can view products, details, prices and availability.
- **Purchase actions require login** — *Add to Cart*, *Buy Now*, and *Proceed to Checkout* open a
  professional MUI **login/register dialog**. The intended action (and product/quantity) is preserved
  and **resumed automatically after a successful sign-in**; dismissing the dialog returns you to
  browsing with your place intact.
- Sessions use an **HttpOnly, SameSite=Lax cookie** set by the backend (the token is never in
  LocalStorage or the URL). The API client sends cookies (`withCredentials`) and echoes the CSRF
  cookie as an `x-csrf-token` header on state-changing requests.
- **Cart is per-user**: stored in `localStorage` namespaced by user id (`quickcart:cart:v1:<id>`),
  cleared on logout, so one account's cart never leaks to another. Orders live in MongoDB.
- Auth state lives in `AuthContext` (`src/context/AuthContext.tsx`), which also renders the
  `AuthDialog` and exposes `requireAuth(action)`.

---

## Tech stack
- **Next.js 16** (App Router, `src/` dir, Cache Components/PPR enabled)
- **React 19** + **TypeScript**
- **Material UI v9** (`@mui/material`, `@mui/icons-material`, `@mui/material-nextjs`)
- **Axios** centralized API client
- **React Context** for cart state, persisted to **localStorage**

## Prerequisites
- Node.js ≥ 18 (developed on Node 24)
- The **backend running** at `http://localhost:5000` with products seeded (see `quickcart-backend/README.md`)

## Installation
```powershell
cd quickcart-frontend
npm install
```

## Environment setup
```powershell
Copy-Item .env.example .env.local
```
| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Backend API base URL **including** `/api` (default `http://localhost:5000/api`) |

> `.env.local` is gitignored; `.env.example` is tracked. `NEXT_PUBLIC_` vars are exposed to the browser (fine — this is just the API URL, no secrets).

## Development commands
```powershell
npm run dev     # start dev server at http://localhost:3000
npm run lint    # ESLint
npm run build   # production build
npm start       # run the production build (after npm run build)
```

## Production build
```powershell
npm run build
npm start
```

## Project structure
```
src/
├── app/
│   ├── layout.tsx                 # metadata + ThemeRegistry
│   ├── page.tsx                   # Home / product listing (/)
│   ├── products/[id]/page.tsx     # server: resolves param under <Suspense>
│   ├── products/[id]/ProductDetails.tsx  # client details UI
│   └── cart/page.tsx              # Shopping cart (/cart)
├── components/
│   ├── ThemeRegistry.tsx          # MUI AppRouterCacheProvider + theme + providers
│   ├── Navbar.tsx                 # links + live cart count badge
│   ├── ProductCard.tsx, CartItem.tsx, QuantitySelector.tsx
│   └── states/ LoadingState, ErrorState, EmptyState
├── context/CartContext.tsx        # cart state + localStorage persistence
├── hooks/useAsyncData.ts          # fetch-with-loading/error/retry hook
├── lib/ api.ts (axios client), theme.ts, format.ts (paise → ₹)
└── types/index.ts                 # Product, CartLine, API envelopes
```

## How it works
- **API client** (`src/lib/api.ts`): typed `getProducts()` / `getProduct(id)` that unwrap the
  backend's `{ success, data }` envelope and normalize errors (network, timeout, HTTP) into a
  readable message for the UI.
- **Prices** are integer **paise** from the backend; `formatINR()` divides by 100 for display.
- **Cart** (`CartContext`): `addItem`, `removeItem`, `updateQuantity`, `clearCart`, plus derived
  `itemCount` and `subtotal`. Uses product id as the stable key (no duplicate lines), caps quantity
  at the last known stock, and persists to `localStorage` (`quickcart:cart:v1`).
- **SSR/hydration safety:** the cart always starts empty on the server and first client render, then
  hydrates from `localStorage` in an effect; a `hydrated` flag gates the navbar count to avoid
  mismatches. Corrupted/outdated stored data is validated and discarded safely.
- **Subtotal is a display estimate only** — the backend is the source of truth for payment amounts.

## Manual testing checklist
- [ ] Home (`/`) lists 8 products with image, name, price, category, stock, Add to Cart (guest, no login).
- [ ] Loading, error (stop the backend → retry), and empty states render correctly.
- [ ] Product details (`/products/<id>`) show image, description, price, availability, quantity selector.
- [ ] Quantity selector cannot exceed available stock; out-of-stock disables Add to Cart / Buy Now.
- [ ] **As a guest**, Add to Cart / Buy Now / Proceed to Checkout each open the **login dialog**.
- [ ] Register (name/email/password/confirm) with validation + password toggle; duplicate email shows an error.
- [ ] After login, the **intended action resumes** (the product is added / you land on cart/checkout).
- [ ] Dismiss the dialog ("Continue browsing") → nothing is added, you stay where you were.
- [ ] Add items → navbar badge updates; account menu shows name + Log out.
- [ ] Cart (`/cart`): change quantity, remove item, clear cart, subtotal updates.
- [ ] **Refresh → cart persists**; **log out → cart clears**; log back in → your cart returns (not another user's).
- [ ] Responsive: cards reflow 1→2→3→4 columns; details, cart, dialog adapt on mobile.

## Troubleshooting
| Symptom | Fix |
|---|---|
| "Cannot reach the server" | Start the backend and confirm `NEXT_PUBLIC_API_URL` |
| Products don't load | Seed the backend (`npm run seed` there); check CORS `FRONTEND_URL=http://localhost:3000` |
| Env change not picked up | Restart `npm run dev` (Next reads env at startup) |

## Deployment
- Deploy to Vercel (ideal for Next.js) or any Node host.
- Set `NEXT_PUBLIC_API_URL` to the deployed backend's `/api` URL.
- Build: `npm run build`; start: `npm start` (or Vercel's managed build).

---

### Git — push this frontend to its own repository
```powershell
cd quickcart-frontend
git init
git add .
git commit -m "QuickCart frontend: Next.js + MUI product listing & cart"
git branch -M main
git remote add origin https://github.com/<you>/quickcart-frontend.git
git push -u origin main
```
