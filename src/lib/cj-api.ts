const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0/v1"
const CJ_AUTH_URL = "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken"

interface CJAuthResponse {
  code: number
  success: boolean
  data: {
    accessToken: string
    accessTokenExpiryDate: string
    refreshToken: string
    refreshTokenExpiryDate: string
  }
}

interface CJProduct {
  id: string
  name: string
  englishName: string
  image: string
  images: string[]
  variantId: string
  sellPrice: number
  stock: number
  categoryName: string
  weight: number
  length: number
  width: number
  height: number
  description: string
  pid: string
}

interface CJProductResponse {
  code: number
  success: boolean
  data: {
    list: CJProduct[]
    total: number
    page: number
    pageSize: number
  }
}

let cachedToken: { token: string; expiresAt: Date } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > new Date()) {
    return cachedToken.token
  }

  const apiKey = process.env.CJ_API_KEY
  if (!apiKey) throw new Error("CJ_API_KEY not configured")

  const res = await fetch(CJ_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CJ auth failed: ${res.status} ${text}`)
  }

  const json: CJAuthResponse = await res.json()
  if (!json.success) throw new Error(`CJ auth error: ${json.code}`)

  cachedToken = {
    token: json.data.accessToken,
    expiresAt: new Date(json.data.accessTokenExpiryDate),
  }

  return json.data.accessToken
}

export async function fetchCJProducts(params: {
  page?: number
  pageSize?: number
  categoryName?: string
  searchName?: string
} = {}): Promise<{ products: CJProduct[]; total: number }> {
  const token = await getAccessToken()

  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set("page", params.page.toString())
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString())
  if (params.categoryName) searchParams.set("categoryName", params.categoryName)
  if (params.searchName) searchParams.set("searchName", params.searchName)

  const url = `${CJ_API_BASE}/product/list?${searchParams.toString()}`

  const res = await fetch(url, {
    headers: { "CJ-Access-Token": token },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CJ product list failed: ${res.status} ${text}`)
  }

  const json: CJProductResponse = await res.json()
  if (!json.success) throw new Error(`CJ product list error: ${json.code}`)

  return {
    products: json.data.list,
    total: json.data.total,
  }
}

export async function submitCJOrder(params: {
  productId: string
  variantId: string
  quantity: number
  shippingAddress: {
    name: string
    phone: string
    country: string
    state: string
    city: string
    address: string
    zip: string
  }
}) {
  const token = await getAccessToken()

  const body = {
    productId: params.productId,
    variantId: params.variantId,
    quantity: params.quantity,
    shippingAddress: params.shippingAddress,
  }

  const res = await fetch(`${CJ_API_BASE}/order/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CJ order create failed: ${res.status} ${text}`)
  }

  const json = await res.json()
  if (!json.success) throw new Error(`CJ order create error: ${json.code}`)
  return json.data
}

export async function getCJCategories(): Promise<string[]> {
  const token = await getAccessToken()

  const res = await fetch(`${CJ_API_BASE}/product/category`, {
    headers: { "CJ-Access-Token": token },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CJ categories failed: ${res.status} ${text}`)
  }

  const json = await res.json()
  if (!json.success) throw new Error(`CJ categories error: ${json.code}`)

  return json.data || []
}

export type { CJProduct }
