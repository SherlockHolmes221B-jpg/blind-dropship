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

let categoryCache: Map<string, string> | null = null

let lastCjRequestTime = 0
const CJ_RATE_LIMIT_MS = 1200

async function rateLimitedCjFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now()
  const elapsed = now - lastCjRequestTime
  if (elapsed < CJ_RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, CJ_RATE_LIMIT_MS - elapsed))
  }
  lastCjRequestTime = Date.now()
  return fetch(url, options)
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > new Date()) {
    return cachedToken.token
  }

  const apiKey = process.env.CJ_API_KEY
  if (!apiKey) throw new Error("CJ_API_KEY not configured")

  const res = await rateLimitedCjFetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
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

  const res = await rateLimitedCjFetch(url, {
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

async function fetchCJPageWithCategory(categoryId: string, pageSize: number): Promise<{ products: CJProduct[] }> {
  const token = await getAccessToken()
  const url = `${CJ_API_BASE}/product/list?page=1&pageSize=${pageSize}&categoryId=${encodeURIComponent(categoryId)}`

  const res = await rateLimitedCjFetch(url, {
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

async function fetchPageAndExtractCategories(page: number): Promise<number> {
  const { raw } = await fetchCJPage(page, 200)
  let added = 0
  for (const item of raw) {
    if (item.categoryId && item.categoryName && !categoryCache!.has(item.categoryId)) {
      categoryCache!.set(item.categoryId, item.categoryName)
      added++
    }
  }
  return added
}

async function buildCategoryCache(): Promise<Map<string, string>> {
  if (categoryCache && categoryCache.size > 0) return categoryCache

  categoryCache = new Map()

  // Fetch pages 1-3 to discover more categories (rate-limited to 1.2s apart)
  for (let page = 1; page <= 3; page++) {
    try {
      const added = await fetchPageAndExtractCategories(page)
      if (added === 0) break // no new categories, stop expanding
    } catch {
      break
    }
  }

  return categoryCache
}

async function expandCategoryCache(): Promise<number> {
  if (!categoryCache) return 0
  let totalAdded = 0
  for (let page = 4; page <= 10; page++) {
    try {
      const added = await fetchPageAndExtractCategories(page)
      totalAdded += added
      if (added === 0) break
    } catch {
      break
    }
  }
  return totalAdded
}

function matchesKeyword(catName: string, keyword: string): boolean {
  const name = catName.toLowerCase()
  const words = keyword.toLowerCase().split(/\s+/).filter(Boolean)
  return words.some((word) => name.includes(word))
}

export async function fetchCJProducts(params: {
  page?: number
  pageSize?: number
  categoryName?: string
  searchName?: string
} = {}): Promise<{ products: CJProduct[]; total: number }> {
  const pageSize = Math.min(params.pageSize || 200, 200)
  const keyword = params.searchName?.trim().toLowerCase()

  if (keyword) {
    const categories = await buildCategoryCache()
    let matchingIds: string[] = []

    for (const [id, name] of categories) {
      if (matchesKeyword(name, keyword)) {
        matchingIds.push(id)
      }
    }

    let allProducts: CJProduct[] = []
    const seenPids = new Set<string>()

    if (matchingIds.length > 0) {
      for (let i = 0; i < Math.min(matchingIds.length, 5); i++) {
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
    }

    // If no products found from category matching, expand cache and retry
    if (allProducts.length === 0) {
      matchingIds = []
      const newCats = await expandCategoryCache()
      if (newCats > 0) {
        for (const [id, name] of categoryCache!) {
          if (matchesKeyword(name, keyword)) {
            matchingIds.push(id)
          }
        }
        for (let i = 0; i < Math.min(matchingIds.length, 5); i++) {
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
      }
    }

    if (allProducts.length > 0) {
      return { products: allProducts, total: allProducts.length }
    }

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
      if (name.toLowerCase() === cat || matchesKeyword(name, cat)) {
        const { products } = await fetchCJPageWithCategory(id, pageSize)
        return { products, total: products.length }
      }
    }
  }

  const { products } = await fetchCJPage(params.page || 1, pageSize)
  return { products, total: products.length }
}

export async function submitCJOrder(params: {
  productId: string
  variantId: string
  quantity: number
  shippingAddress: { name: string; phone: string; country: string; state: string; city: string; address: string; zip: string }
}) {
  const token = await getAccessToken()

  const res = await rateLimitedCjFetch(`${CJ_API_BASE}/order/create`, {
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
