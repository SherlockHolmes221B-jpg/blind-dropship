<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:session-summary -->
# Session Summary — June 26, 2026

## Project: Blind Dropship Management App

## What We Built
- Next.js 16.2.9 + TypeScript + Tailwind v4 app at C:\Users\agath\blind-dropship
- PostgreSQL (Neon) for production, Prisma v7 with @prisma/adapter-pg
- JWT-based auth with admin + supplier roles
- Dashboard with pipeline monitoring (products, orders, exceptions)
- Exceptions page (products not on eBay, low margins, unassigned orders)
- Team page (multi-user admin management)
- Full CRUD for Products, Suppliers, Orders
- CJ Dropshipping API integration (import products)
- Analytics page (revenue, profit, margins)
- Supplier portal (limited view for suppliers)
- eBay API client (ready for keys)
- PayPal webhook stub

## Accounts Created
- **PayPal Business:** agathon's account (with Business Debit Card)
- **eBay Seller:** agama_55 (username)
- **CJ Dropshipping:** API key in .env
- **Neon (PostgreSQL):** Database created at console.neon.tech
- **GitHub:** SherlockHolmes221B-jpg/blind-dropship
- **Vercel:** Deployed at blind-dropship.vercel.app

## App Credentials
- Admin: admin@blinddropship.com / admin123
- Partner: partner@blinddropship.com / partner123

## Environment Variables (in .env and Vercel)
- DATABASE_URL (Neon PostgreSQL)
- SESSION_SECRET
- CJ_API_KEY

## What's PENDING for next session
1. **eBay Developer account** — still pending approval (24h). Once approved, get App ID, Cert ID, Dev ID and add to Vercel env vars. Then remove the `EBAY_` placeholder code and connect for real.
2. **Vercel PostgreSQL** — switch from Neon's direct connect to Vercel's Storage integration (optional, works fine as-is)
3. **Spocket** — user decided not to use it. Sticking with CJ Dropshipping only.
4. **Production hardening** — proper SESSION_SECRET, rate limiting, error monitoring

## Key Architecture
- Prisma v7 with postgresql provider, PrismaPg adapter
- schema.prisma has `url` removed (moved to prisma.config.ts)
- seed.ts uses PrismaPg adapter (not PrismaSqlite)
- Generated client at src/generated/prisma (gitignored, generated via postinstall)
- Build on Vercel: `prisma generate && prisma db push --accept-data-loss && next build`
<!-- END:session-summary -->
