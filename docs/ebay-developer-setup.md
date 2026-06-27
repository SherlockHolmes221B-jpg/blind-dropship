# eBay Developer API App Setup Guide

> Create an eBay Developer account and register an application so your management system can connect to eBay.

---

## Why You Need This

The management system uses the eBay API to:
- **Import orders automatically** (no manual entry)
- **Sync inventory** (when suppliers update stock)
- **List products** (optional — bulk upload from supplier catalogs)
- **Track sales data** (directly from eBay for analytics)

---

## Step-by-Step Setup

### 1. Create an eBay Developer Account

- Go to https://developer.ebay.com
- Click **"Join"** or **"Sign Up"**
- Use your **existing eBay account** to log in (your seller account)
- Accept the **Developer Program Terms & Conditions**
- Verify your email if prompted

**Cost**: Free (no cost to register or use the API for a single application)

### 2. Create a New Application (API Key)

- In the Developer Dashboard, click **"Create a key"**
- Choose **"User Consent Token"** flow (this is for applications that act on behalf of an eBay user — i.e., you)
- Name your application: **"Blind Dropship Management"** (or any name)
- For **"Which eBay marketplace will you use?"** → Select **"eBay US (ebay.com)"**

After creation, you'll get:

```
App ID (Client ID):     abcd-1234-....-xxxxxxxx
Cert ID (Client Secret):  abcd-1234-....-xxxxxxxx
Dev ID:                  abcd-1234-....-xxxxxxxx
```

**Save all three values** — you'll need them for the `.env` file.

### 3. Set Up OAuth Scopes

Your application needs permission to access certain eBay data:

1. In your app settings → **OAuth Scopes**
2. Select these scopes (minimum required):

| Scope | What It Allows |
|-------|----------------|
| `https://api.ebay.com/oauth/api_scope/sell.fulfillment` | Read/update orders, mark as shipped |
| `https://api.ebay.com/oauth/api_scope/sell.inventory` | Read/create inventory items |
| `https://api.ebay.com/oauth/api_scope/sell.marketing` | Promotions and ads (optional) |
| `https://api.ebay.com/oauth/api_scope/sell.account` | Read seller account settings |
| `https://api.ebay.com/oauth/api_scope/sell.analytics.readonly` | Read sales performance data |

### 4. Set Up eBay OAuth Redirect URL

This is needed for the **authorization code grant flow** — the first time you connect, you'll authorize your app to access your eBay data.

1. In your app settings → **OAuth Redirect URLs**
2. Add: `https://yourdomain.com/api/auth/ebay/callback`
3. (For local dev testing, you can add `http://localhost:3000/api/auth/ebay/callback`)

### 5. Generate Your Access Token (Manual — Once)

The management system will handle token refresh automatically, but you need an initial token:

1. Go to your app page in Developer Dashboard
2. Click **"Get a Token"** (or use the **eBay OAuth Playground**)
3. Log in to your eBay seller account
4. Authorize the scopes
5. You'll receive an **Access Token** (expires in 2 hours) and a **Refresh Token** (long-lived)

**The Refresh Token is what matters** — the app can use it to get new access tokens automatically.

### 6. Store Credentials

Add these to your `.env` file:

```env
EBAY_APP_ID=your_app_id
EBAY_CERT_ID=your_cert_id
EBAY_DEV_ID=your_dev_id
EBAY_REFRESH_TOKEN=your_refresh_token
```

---

## For Production (Live API Access)

You start in **Sandbox** mode by default. To go live:

1. Go to **Application Keys** → **Production Keys** tab
2. Click **"Get Production Keys"**
3. eBay will review your application (usually automatic unless something looks suspicious)
4. Once approved, you'll get production App ID and Cert ID
5. Generate a new refresh token for production

**Sandbox vs Production:**

| Feature | Sandbox | Production |
|---------|---------|------------|
| Real orders | ❌ | ✅ |
| Real money | ❌ | ✅ |
| Rate limits | Higher | 50–500 req/day depending on scope |
| Keys | Separate | Separate |
| eBay site | sandbox.ebay.com | ebay.com |

**Start in Sandbox** for testing, then switch to Production when ready to go live.

---

## eBay API Rate Limits

| API | Daily Limit | Per-Second Limit |
|-----|-------------|------------------|
| Fulfillment API | 500,000 | 100 |
| Inventory API | 600,000 | 100 |
| Analytics API | 50,000 | 50 |

These are generous — you won't hit them unless you're doing millions of orders.

---

## Testing Your API Connection

Once credentials are configured:

1. Start the management app
2. Go to **Settings** → **eBay Integration**
3. Click **"Test eBay Connection"**
4. If successful: ✅ You'll see your eBay seller name and account status
5. If failed: Check credentials and refresh token

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `invalid_token` | Refresh token expired | Generate a new one from Developer Dashboard |
| `application_not_found` | Wrong App ID | Check your credentials |
| `unauthorized_client` | Wrong OAuth scope | Re-authorize with correct scopes |
| `rate_limit_exceeded` | Too many API calls | Wait 1 hour, reduce polling frequency |
| `seller_account_not_found` | Not linked to an active seller account | Verify you have a seller account on eBay.com |

---

## Next Steps

Once you have your eBay Developer credentials:

1. Share these values with me:
   - **App ID (Client ID)**
   - **Cert ID (Client Secret)**
   - **Refresh Token**
2. I'll add them to the `.env` file and build the eBay integration
3. The management system will then auto-import orders, sync inventory, and pull analytics

---

## Reference Links

- eBay Developer Portal: https://developer.ebay.com
- eBay API Documentation: https://developer.ebay.com/api-docs/static/api-docs.html
- OAuth Guide: https://developer.ebay.com/api-docs/static/oauth-tokens.html
- eBay SDK for JavaScript: https://github.com/eBay/ebay-oauth-nodejs-client
