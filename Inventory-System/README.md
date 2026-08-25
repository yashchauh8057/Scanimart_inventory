# Scanimart Inventory System

## Firebase Realtime Database setup

1. Create a Firebase project and enable **Realtime Database** in the Firebase Console.
2. In **Project settings → Service accounts**, generate a private key and save it as `serviceAccountKey.json` in this project folder. Do not commit this file.
3. Copy `.env.example` to `.env` and replace `FIREBASE_DATABASE_URL` with your Realtime Database URL.
4. Install packages and start the API server:

   ```bash
   npm install
   npm run seed
   npm start
   ```

5. Open [http://127.0.0.1:3000/frontend/dashboard.html](http://127.0.0.1:3000/frontend/dashboard.html).

The dashboard requests all values from the Node.js API. The API calculates totals, revenue, monthly sales, category revenue, low-stock products, and latest records from Firebase. `/api/dashboard/stream` pushes a new result automatically whenever Realtime Database data changes.

## Role-based panels

Login at [http://127.0.0.1:3000/frontend/login.html](http://127.0.0.1:3000/frontend/login.html) with a panel ID and password. Each role is a separate page opened right after login:

| Role | Email | Password | Page |
|------|-------|----------|------|
| Admin | `admin@scanimart.com` | `admin123` | `frontend/dashboard.html` – inventory management (products, categories, customers, suppliers, sales, purchase, stock, expenses, users) |
| Customer | `user@scanimart.com` | `user123` | `frontend/pos.html` – scan/search products, build a cart, pay |
| Cash Counter | `staff@scanimart.com` | `staff123` | `frontend/cash-counter.html` – scan cash QR, collect cash, mark paid |
| Security | `security@scanimart.com` | `security123` | `frontend/exit-check.html` – scan exit QR, verify payment before exit |

Credentials are validated by `POST /api/auth/login` against the `users` collection in the Realtime Database, and the session redirects to that role's panel. Add or change accounts by editing `users` in Firebase (fields: `name`, `email`, `password`, `role`, `status`).

**Customer → Cash Counter → Security flow**

## Razorpay payments (optional)

1. Create a Razorpay account and get API keys from **Settings → API Keys**.
2. Add them to `.env`:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
3. Add the Key ID to `js/app-config.js` → `razorpay.key`.

Without keys the app runs in cash-only mode.

## Firebase data paths

The included seed command uses these top-level paths:

- `products`
- `customers`
- `orders`
- `activities`

To use your own data, preserve the fields shown in `server/seed.js`, especially `createdAt`, `total`, `stock`, and `reorderLevel`.
