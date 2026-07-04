const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0/v1"

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

interface CJRawProduct {
  pid: string
  productName: string
  productNameEn: string
  productImage: string
  productSku: string
  sellPrice: string
  listingCount: string
  categoryName: string
  categoryId: string
  productWeight: string
  remark: string
}

interface CJResponse {
  code: number
  success: boolean
  data: {
    list: CJRawProduct[]
    total: number
    page: number
    pageSize: number
  }
}

let cachedToken: { token: string; expiresAt: Date } | null = null

// In-memory category cache: categoryId -> categoryName
let categoryCache: Map<string, string> | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > new Date()) {
    return cachedToken.token
  }

  const apiKey = process.env.CJ_API_KEY
  if (!apiKey) throw new Error("CJ_API_KEY not configured")

  const res = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CJ auth failed: ${res.status} ${text}`)
  }

  const json = await res.json()
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

function mapProduct(item: CJRawProduct): CJProduct {
  return {
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
  }
}

async function fetchCJPage(page: number, pageSize: number): Promise<{ products: CJProduct[]; total: number; raw: CJRawProduct[] }> {
  const token = await getAccessToken()
  const url = `${CJ_API_BASE}/product/list?page=${page}&pageSize=${pageSize}`

  const res = await fetch(url, {
    headers: { "CJ-Access-Token": token },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CJ product list failed: ${res.status} ${text}`)
  }

  const json: CJResponse = await res.json()
  if (!json.success) throw new Error(`CJ product list error: ${json.code}`)

  const raw = json.data.list || []
  return {
    products: raw.map(mapProduct),
    total: json.data.total,
    raw,
  }
}

async function buildCategoryCache(): Promise<Map<string, string>> {
  if (categoryCache && categoryCache.size > 0) return categoryCache

  const { raw } = await fetchCJPage(1, 200)
  categoryCache = new Map()

  for (const item of raw) {
    if (item.categoryId && item.categoryName && !categoryCache.has(item.categoryId)) {
      categoryCache.set(item.categoryId, item.categoryName)
    }
  }

  return categoryCache
}

export async function fetchCJProducts(params: {
  page?: number
  pageSize?: number
  categoryName?: string
  searchName?: string
} = {}): Promise<{ products: CJProduct[]; total: number }> {
  const pageSize = Math.min(params.pageSize || 200, 200)
  const keyword = params.searchName?.trim().toLowerCase()

  // If searching by keyword, find matching categories first, then fetch by categoryId
  if (keyword) {
    const categories = await buildCategoryCache()
    const matchingIds: string[] = []

    for (const [id, name] of categories) {
      if (name.toLowerCase().includes(keyword)) {
        matchingIds.push(id)
      }
    }

    if (matchingIds.length > 0) {
      // Fetch products from up to 5 matching categories
      const allProducts: CJProduct[] = []
      const seenPids = new Set<string>()

      for (let i = 0; i < Math.min(matchingIds.length, 5); i++) {
        await new Promise((r) => setTimeout(r, 1100))
        try {
          const { products } = await fetchCJPageWithCategory(matchingIds[i], pageSize)
          for (const p of products) {
            if (!seenPids.has(p.pid)) {
              seenPids.add(p.pid)
              allProducts.push(p)
            }
          }
        } catch {
          continue
        }
      }

      if (allProducts.length > 0) {
        return { products: allProducts, total: allProducts.length }
      }
    }

    // Fallback: fetch latest products and filter locally
    const { products } = await fetchCJPage(params.page || 1, pageSize)
    const filtered = products.filter((p) =>
      p.englishName.toLowerCase().includes(keyword) ||
      p.name.toLowerCase().includes(keyword) ||
      p.categoryName.toLowerCase().includes(keyword)
    )

    return { products: filtered, total: filtered.length }
  }

  if (params.categoryName) {
    const categories = await buildCategoryCache()
    const cat = params.categoryName.trim().toLowerCase()
    for (const [id, name] of categories) {
      if (name.toLowerCase() === cat || name.toLowerCase().includes(cat)) {
        const { products } = await fetchCJPageWithCategory(id, pageSize)
        return { products, total: products.length }
      }
    }
  }

  const { products } = await fetchCJPage(params.page || 1, pageSize)
  return { products, total: products.length }
}

async function fetchCJPageWithCategory(categoryId: string, pageSize: number): Promise<{ products: CJProduct[] }> {
  const token = await getAccessToken()
  const url = `${CJ_API_BASE}/product/list?page=1&pageSize=${pageSize}&categoryId=${encodeURIComponent(categoryId)}`

  const res = await fetch(url, {
    headers: { "CJ-Access-Token": token },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CJ category fetch failed: ${res.status} ${text}`)
  }

  const json: CJResponse = await res.json()
  if (!json.success) throw new Error(`CJ category fetch error: ${json.code}`)

  return { products: (json.data.list || []).map(mapProduct) }
}

export async function submitCJOrder(params: {
  productId: string
  variantId: string
  quantity: number
  shippingAddress: { name: string; phone: string; country: string; state: string; city: string; address: string; zip: string }
}) {
  const token = await getAccessToken()

  const res = await fetch(`${CJ_API_BASE}/order/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
    body: JSON.stringify({
      productId: params.productId,
      variantId: params.variantId,
      quantity: params.quantity,
      shippingAddress: params.shippingAddress,
    }),
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
  const categories = await buildCategoryCache()
  return Array.from(categories.values())
}

export type { CJProduct }
