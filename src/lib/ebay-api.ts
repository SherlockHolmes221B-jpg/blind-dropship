const EBAY_API_BASE = "https://api.ebay.com"

interface EbayConfig {
  appId: string
  certId: string
  refreshToken: string
}

function getConfig(): EbayConfig | null {
  const appId = process.env.EBAY_APP_ID
  const certId = process.env.EBAY_CERT_ID
  const refreshToken = process.env.EBAY_REFRESH_TOKEN
  if (!appId || !certId || !refreshToken) return null
  return { appId, certId, refreshToken }
}

async function getAccessToken(config: EbayConfig): Promise<string> {
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${config.appId}:${config.certId}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
      scope: "https://api.ebay.com/oauth/api_scope/sell.fulfillment https://api.ebay.com/oauth/api_scope/sell.inventory",
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`eBay OAuth failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.access_token
}

export interface EbayOrder {
  ebayOrderId: string
  buyerUsername: string
  buyerName: string
  buyerEmail: string
  shippingAddress: {
    name: string
    line1: string
    line2: string
    city: string
    state: string
    zip: string
    country: string
  }
  items: Array<{
    sku: string
    title: string
    quantity: number
    price: number
  }>
  totalPrice: number
  orderDate: string
}

export async function fetchEbayOrders(sinceDays: number = 7): Promise<EbayOrder[]> {
  const config = getConfig()
  if (!config) return []

  const token = await getAccessToken(config)

  const since = new Date()
  since.setDate(since.getDate() - sinceDays)

  const res = await fetch(
    `${EBAY_API_BASE}/sell/fulfillment/v1/order?filter=creationdate:%5B${since.toISOString()}..${new Date().toISOString()}%5D&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`eBay orders fetch failed: ${res.status} ${text}`)
  }

  const data = await res.json()

  return (data.orders || []).map((order: any) => ({
    ebayOrderId: order.legacyOrderId || order.orderId,
    buyerUsername: order.buyer?.username || "",
    buyerName: order.buyer?.name || "",
    buyerEmail: order.buyer?.email || "",
    shippingAddress: {
      name: order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.fullName || "",
      line1: order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.addressLine1 || "",
      line2: order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.addressLine2 || "",
      city: order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.city || "",
      state: order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.stateOrProvince || "",
      zip: order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.postalCode || "",
      country: order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.countryCode || "",
    },
    items: (order.lineItems || []).map((item: any) => ({
      sku: item.sku || "",
      title: item.title || "",
      quantity: item.quantity || 0,
      price: parseFloat(item.lineItemCost?.value || "0"),
    })),
    totalPrice: parseFloat(order.totalFeeBasisAmount?.value || "0") || parseFloat(order.total?.value || "0"),
    orderDate: order.creationDate || "",
  }))
}

export async function createEbayListing(product: {
  sku: string
  name: string
  description: string
  price: number
  quantity: number
  image: string
  categoryId?: string
}): Promise<string | null> {
  const config = getConfig()
  if (!config) return null

  const token = await getAccessToken(config)

  const offer = {
    sku: product.sku,
    marketplaceId: "EBAY_US",
    format: "FIXED_PRICE",
    availableQuantity: product.quantity,
    pricingSummary: {
      price: { value: product.price.toFixed(2), currency: "USD" },
    },
  }

  const res = await fetch(`${EBAY_API_BASE}/sell/inventory/v1/offer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(offer),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`eBay listing failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.offerId || null
}

export function isEbayConfigured(): boolean {
  return !!getConfig()
}
