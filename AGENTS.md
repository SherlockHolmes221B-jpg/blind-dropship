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
- CJ Dropshipping API V2 integration (keyword search, real stock, all categories)
- Zapier webhook for automated eBay order fulfillment
- Analytics page (revenue, profit, margins)
- Supplier portal (limited view for suppliers)
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
1. **Vercel PostgreSQL** — switch from Neon's direct connect to Vercel's Storage integration (optional, works fine as-is)
2. **Production hardening** — proper SESSION_SECRET, rate limiting, error monitoring

## Zapier Automation (eBay → App → CJ Fulfillment)
Since eBay declined the Developer account, automation goes through Zapier.

### How it works
1. Zapier watches your eBay seller account for new paid orders
2. When an order comes in, Zapier POSTs the customer/shipping data to:
   `https://blind-dropship.vercel.app/api/ebay/webhook`
3. The webhook finds your product by `ebayItemId` (the Listing ID you entered)
4. Creates the customer & order in the database
5. Auto-submits the order to CJ Dropshipping for fulfillment
6. CJ ships directly to your customer

### Prerequisites
- You must enter the eBay Item ID in each product's edit form (the "Listing ID" field)
- The product must have been imported from CJ (so `sku` and `cjVariantId` are set)
- Add a `ZAPIER_WEBHOOK_SECRET` in Vercel env (Settings → Environment Variables)

### Zapier Free Tier Setup (100 tasks/month, 2 Zaps)

Step 1 — Generate a secret:
```
openssl rand -hex 32
```
Or use any random string. Add it as `ZAPIER_WEBHOOK_SECRET` in Vercel env.

Step 2 — Create the Zap:
1. Go to https://zapier.com/app/editor
2. Trigger: **eBay** → **New Order** (connects to your seller account)
3. Action: **Webhooks by Zapier** → **POST**
4. URL: `https://blind-dropship.vercel.app/api/ebay/webhook`
5. Headers: `Authorization: <your-secret>`
6. Payload Type: JSON
7. Map these fields from eBay:
   - `ebayOrderId` → Order ID (from eBay)
   - `ebayItemId` → Item ID (from eBay, matches what you put in the product's Listing ID field)
   - `customerName` → Buyer Name
   - `customerEmail` → Buyer Email
   - `customerPhone` → Buyer Phone
   - `shippingAddress` → Street Address
   - `shippingCity` → City
   - `shippingState` → State
   - `shippingZip` → Zip Code
   - `shippingCountry` → Country Code (e.g., US)
   - `quantity` → Quantity Purchased
   - `totalPrice` → Order Total
8. Test the Zap
9. Turn it on

### Free Tier Limitations
- 100 orders/month (about 3/day)
- 15-minute polling delay (not instant)
- 2 Zaps max
- Upgrade to paid ($20-30/mo) for instant triggers and more tasks

## Key Architecture
- Prisma v7 with postgresql provider, PrismaPg adapter
- schema.prisma has `url` removed (moved to prisma.config.ts)
- seed.ts uses PrismaPg adapter (not PrismaSqlite)
- Generated client at src/generated/prisma (gitignored, generated via postinstall)
- Build on Vercel: `prisma generate && prisma db push --accept-data-loss && next build`
<!-- END:session-summary -->
