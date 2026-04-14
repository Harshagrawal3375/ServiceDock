# Student Helper

Student Helper is a full-stack platform for academic service orders where:
- Clients place paid orders (assignments, tasks, PPTs, projects, etc.).
- Admin manages all clients, orders, returns, and refunds from a dedicated dashboard.
- Transactions are tracked for both payments and refunds.

## Tech Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend API: Express.js + MongoDB (Mongoose)
- Auth: JWT + role-based access (`client`, `admin`)

## Key Features Implemented
- Role-based authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- Order lifecycle with status updates
- Return request flow for clients
- Admin decision flow for returns (approve/reject, content return + money refund)
- Transaction ledger (`payment` and `refund`)
- Admin dashboard with:
  - total clients/orders/revenue/refunds
  - pending return requests
  - complete client overview table
- Responsive UI:
  - client screens (home, create order, orders, profile, transactions)
  - admin dashboard screen

## Environment Variables
Copy `.env.example` to `.env` and update values:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
ADMIN_REGISTRATION_CODE=optional_admin_signup_code
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Run Project
Install dependencies:

```bash
npm install
```

Run backend API:

```bash
npm run api:start
```

Run frontend:

```bash
npm run dev
```

Run the full app together on Windows:

```bat
start-project.cmd
```

This launcher builds the frontend first and then starts:
- frontend at `http://localhost:3000`
- backend at `http://localhost:5000`

If you want the development server instead, use:

```bash
npm run dev:all
```

You can also run the stable combined starter directly with Node:

```bash
node scripts/start-all.js
```

## Main API Routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status` (admin)
- `POST /api/orders/:id/return-request` (client)
- `PATCH /api/orders/:id/return-decision` (admin)
- `GET /api/transactions`
- `GET /api/transactions/summary`
- `GET /api/admin/dashboard`
- `GET /api/admin/clients`
- `GET /api/admin/orders`

## Current Gaps / Next Milestones
1. Real payment gateway integration (Razorpay/Stripe) instead of simulated payment capture.
2. File upload storage (S3/Cloudinary) for order and delivery files.
3. Chat backend integration (chat page currently uses mock conversation).
4. Production auth hardening:
   - refresh token strategy
   - httpOnly cookie option
   - rate limiting on auth endpoints
5. Better admin filters/search/export for large client and order datasets.
