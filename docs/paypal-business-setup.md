# PayPal Business Account Setup Guide

> Create a PayPal Business account to receive payments from eBay sales and pay dropshipping suppliers.

---

## Prerequisites

- **Your personal bank account** (checking account in your name or business name)
- **Your SSN or EIN** (for identity verification)
- **Email address** you haven't used for PayPal before
- **Phone number**
- **Business details** (can be sole proprietorship using your legal name)

---

## Step-by-Step Setup

### 1. Go to PayPal Business Signup
- URL: https://www.paypal.com/businesssignup
- Click **"Sign Up"** or **"Get Started"**

### 2. Choose Account Type
- Select **"Business Account"**
- If asked: **"Do you already have a PayPal account?"** → Click **"No"** (create fresh)

### 3. Enter Your Email
- Use a dedicated business email (e.g., `business@yourdomain.com` or a Gmail)
- Create a **strong password** (use a password manager)

### 4. Fill in Business Information
| Field | What to Enter |
|-------|---------------|
| First & Last Name | Your legal name |
| Business Name | Your DBA (Doing Business As) name — e.g., "Agath Dropship" |
| Business Phone | Your phone number |
| Business Address | Your home address or registered business address |
| Business Type | **Individual/Sole Proprietor** (start here; upgrade later if needed) |
| Website URL | Your eBay Store URL or your management system URL |

### 5. Customer Transactions
- **What are you selling?** → "Goods" → "Physical Goods"
- **Describe your business** → "E-commerce / Online Retail"
- **Monthly sales volume** → Estimate low ($1,000–$5,000) initially

### 6. Link Your Bank Account
- Click **"Link a bank account"**
- PayPal offers two methods:
  - **Instant verification**: Login to your bank via Plaid (fastest)
  - **Manual verification**: PayPal deposits 2 small amounts (~$0.01–$0.99); you confirm amounts (2–3 days)
- You need a **checking account** (not savings) that accepts ACH transfers

### 7. Identity Verification (KYC)
PayPal will ask for:
- **SSN or ITIN** (last 4 digits initially, full number later when you hit thresholds)
- **Date of birth**
- **Government-issued ID** (driver's license, passport, or state ID)
- **Proof of business address** (utility bill or bank statement)

⚠️ **Important**: You CANNOT complete setup without submitting ID. PayPal is regulated as a financial institution.

### 8. Set Up PayPal Business Profile
- Go to **Settings** → **Business Information**
- Set your **return policy URL** (you'll create this on eBay)
- Set your **customer service email**
- Upload your logo (optional but professional)

### 9. Configure Payment Receiving
- By default, PayPal is ready to receive payments
- Verify there are **no holds or limitations** on your account
- Enable **Payment Review** if desired (fraud protection)

---

## Post-Setup Configuration

### Enable PayPal Checkout for eBay
eBay automatically accepts PayPal. To ensure smooth flow:
- In **eBay Seller Hub** → **Payment Preferences** → Ensure PayPal is listed as an accepted payment method
- Set **"Immediate payment required"** on your listings (Buy It Now only)

### Set Up PayPal for Supplier Payments
- Add **funds to PayPal balance** (from eBay sales)
- Use **"Send payments"** → "Pay for goods or services" to pay suppliers
- Always use **"Goods and Services"** (not Friends & Family) — this gives you buyer protection

### Connect PayPal to Your Management System
When we build PayPal API integration:
1. Go to **PayPal Developer Dashboard**: https://developer.paypal.com/dashboard
2. Click **"Log in to Dashboard"** (use your Business account)
3. Create a **REST API app**:
   - Click **"Create App"**
   - Name it (e.g., "Blind Dropship Management")
   - Select your Business account
4. Copy **Client ID** and **Secret** — these go into your `.env` file:
   ```
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_secret
   ```
5. Webhook URL (for automatic transaction import):
   - In your PayPal app settings → **Webhooks**
   - Add webhook URL: `https://yourdomain.com/api/webhooks/paypal`
   - Events to subscribe to: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`

---

## Important Settings

| Setting | Location | Recommendation |
|---------|----------|----------------|
| Payment holds | Settings → Seller Settings | Set to "0 days after delivery" (if trusted account) |
| Currency | Settings → Financial Info | USD only (US-based) |
| Automatic payments | Settings → Payments | Enable for recurring supplier payments |
| Tax invoice | Settings → Invoicing | Optional; you may not need invoices initially |
| 2FA (Two-Factor Auth) | Settings → Security | **MANDATORY** — enable immediately |

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Account受限 (limited)" | Submit ID verification documents. Respond to PayPal's requests within 7 days or account gets permanently limited. |
| Funds on hold | New accounts have 21-day holds. eBay sales may be held until tracking shows delivered. To reduce: upload tracking proactively. |
| Bank verification failed | Ensure your bank accepts ACH. Call your bank to authorize PayPal. |
| "Business name mismatch" | If using DBA (Doing Business As), have DBA paperwork ready. If Sole Proprietor, just use your legal name. |
| International payments blocked | Enable in Settings → Payments → "Accept payments from outside the US" (if you sell to Canada) |

---

## Monthly Limits (New Accounts)

PayPal applies these limits to new accounts:

| Limit | Amount | Duration |
|-------|--------|----------|
| Payment receiving | Typically no limit | Immediate |
| Withdrawal to bank | $500–$5,000/day | Depends on account age |
| Sending payments | $10,000/month | First 60 days |
| Total account limit | Removed after verification | 1–2 weeks after ID verified |

These limits increase as your account ages and builds history.

---

## Security Checklist

- [ ] Enable 2FA (Google Authenticator or SMS)
- [ ] Never share your PayPal password or API secret
- [ ] Set up email notifications for all transactions
- [ ] Review account activity weekly
- [ ] Keep PayPal balance low (withdraw profits to bank regularly)
- [ ] Never log in from public/shared computers
- [ ] Use a dedicated email for PayPal (not your personal email)

---

## Next Step After Setup

Once your PayPal Business account is active:
1. Go to https://developer.paypal.com/dashboard
2. Log in with your Business account
3. Create a REST API App → get **Client ID** and **Secret**
4. Share those credentials with me so I can add PayPal integration to the dashboard
