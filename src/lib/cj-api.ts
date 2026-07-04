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

function parsePrice(price: string): number {
  const match = price.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

async function fetchCJPage(page: number, pageSize: number): Promise<{ products: CJProduct[]; total: number }> {
  const token = await getAccessToken()

  const url = `${CJ_API_BASE}/product/list?page=${page}&pageSize=${pageSize}`

  const res = await fetch(url, {
    headers: { "CJ-Access-Token": token },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CJ product list failed: ${res.status} ${text}`)
  }

  const json: CJProductResponse = await res.json()
  if (!json.success) throw new Error(`CJ product list error: ${json.code}`)

  const products: CJProduct[] = (json.data.list || []).map((item: any) => ({
    pid: item.pid,
    name: item.productName || "",
    englishName: item.productNameEn || "",
    image: item.productImage || "",
    images: item.productImage ? [item.productImage] : [],
    variantId: item.productSku || "",
    sellPrice: parsePrice(item.sellPrice || "0"),
    stock: parseInt(item.listingCount) || 0,
    categoryName: item.categoryName || "",
    weight: parseFloat(item.productWeight) || 0,
    length: 0,
    width: 0,
    height: 0,
    description: item.remark || "",
  }))

  return { products, total: json.data.total }
}

function matchesKeyword(product: CJProduct, keyword: string): boolean {
  const kw = keyword.toLowerCase()
  return (
    product.englishName.toLowerCase().includes(kw) ||
    product.name.toLowerCase().includes(kw) ||
    product.categoryName.toLowerCase().includes(kw)
  )
}

export async function fetchCJProducts(params: {
  page?: number
  pageSize?: number
  categoryName?: string
  searchName?: string
} = {}): Promise<{ products: CJProduct[]; total: number }> {
  const pageSize = Math.min(params.pageSize || 200, 200)

  const result = await fetchCJPage(params.page || 1, pageSize)
  let products = result.products
  let total = result.total

  const keyword = params.searchName?.trim().toLowerCase()
  const category = params.categoryName?.trim().toLowerCase()

  if (keyword || category) {
    const initialMatchCount = products.filter((p) => {
      if (keyword && !matchesKeyword(p, keyword)) return false
      if (category && !p.categoryName.toLowerCase().includes(category)) return false
      return true
    }).length

    if (initialMatchCount < 20) {
      const seenPids = new Set(products.map((p) => p.pid))
      for (let pg = 2; pg <= 5; pg++) {
        await new Promise((r) => setTimeout(r, 1100))
        try {
          const nextPage = await fetchCJPage(pg, pageSize)
          for (const p of nextPage.products) {
            if (!seenPids.has(p.pid)) {
              seenPids.add(p.pid)
              products.push(p)
            }
          }
        } catch {
          break
        }
        const matchCount = products.filter((p) => {
          if (keyword && !matchesKeyword(p, keyword)) return false
          if (category && !p.categoryName.toLowerCase().includes(category)) return false
          return true
        }).length
        if (matchCount >= 40) break
      }
    }

    products = products.filter((p) => {
      if (keyword && !matchesKeyword(p, keyword)) return false
      if (category && !p.categoryName.toLowerCase().includes(category)) return false
      return true
    })
  }

  return { products, total }
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
