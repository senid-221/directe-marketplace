# AkaziConnect Marketplace

Rwanda-first multi-vendor marketplace platform.

## Stack
- Next.js + TypeScript
- PostgreSQL + Prisma
- REST API routes
- AkaziConnect customer storefront
- Seller Center
- Admin Portal

## Backend API
- GET /api/health
- GET/POST /api/categories
- GET/POST /api/products
- GET/PATCH/DELETE /api/products/:id
- POST /api/auth/register
- POST /api/auth/login
- GET/POST /api/cart
- GET/POST /api/orders
- GET/POST /api/sellers
- POST /api/sellers/:id/approve
- GET /api/admin/dashboard
- POST /api/payments/create
- GET /api/payments/verify
- POST /api/payments/webhook

## Payments
AkaziConnect uses Flutterwave hosted checkout for RWF payments. Configure `FLW_SECRET_KEY`, `FLW_PUBLIC_KEY`, `FLW_SECRET_HASH`, and `NEXT_PUBLIC_APP_URL` in the deployment environment. The server verifies the transaction before marking an order as paid and reducing stock.

Flutterwave currently documents card and Rwanda mobile-money support for RWF. Available methods can depend on the merchant account and dashboard configuration.

## Local setup
1. Copy .env.example to .env.
2. Set DATABASE_URL and JWT_SECRET.
3. Run npm install.
4. Run npx prisma generate.
5. Create/apply migrations with npx prisma migrate dev --name init.
6. Start with npm run dev.

## Seed
Run: npx tsx prisma/seed.ts

The demo seed data is for development only and must be replaced before production.
