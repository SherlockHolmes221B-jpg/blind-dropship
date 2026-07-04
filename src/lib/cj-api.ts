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
  warehouseInventoryNum?: string | number
}

interface CJV2Product {
  id: string
  nameEn: string
  bigImage: string
  sku: string
  spu: string
  sellPrice: string
  nowPrice: string
  listedNum: number
  categoryId: string
  threeCategoryName: string
  warehouseInventoryNum: number
  totalVerifiedInventory: number
  totalUnVerifiedInventory: number
  addMarkStatus: number
  isVideo: number
  productType: string
  supplierName: string
  createAt: number
  deliveryCycle: string
  description?: string
}

interface CJV2ContentItem {
  productList: CJV2Product[]
  relatedCategoryList: { categoryId: string; categoryName: string }[]
  keyWord: string
  keyWordOld: string
}

interface CJV2Response {
  code: number
  result: boolean
  message: string
  data: {
    pageSize: number
    pageNumber: number
    totalRecords: number
    totalPages: number
    content: CJV2ContentItem[]
  }
  requestId: string
  success: boolean
}

interface CJResponse {
  code: number
  result: boolean
  message: string
  data: {
    list: CJRawProduct[]
    total: number
    pageNum?: number
    pageSize?: number
  }
  requestId: string
  success: boolean
}

interface CJCategory {
  categoryId: string
  categoryName: string
  categoryFirstName?: string
  categoryFirstList?: CJCategory[]
  categorySecondName?: string
  categorySecondList?: CJCategory[]
}

interface CJCategoryResponse {
  code: number
  result: boolean
  message: string
  data: CJCategory[]
  requestId: string
  success: boolean
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

async function fetchAllCategories(): Promise<Map<string, string>> {
  const token = await getAccessToken()

  const res = await rateLimitedCjFetch(`${CJ_API_BASE}/product/getCategory`, {
    headers: { "CJ-Access-Token": token },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CJ category list failed: ${res.status} ${text}`)
  }

  const json: CJCategoryResponse = await res.json()
  if (!json.success) throw new Error(`CJ category list error: ${json.code}`)

  const map = new Map<string, string>()

  function walk(list: CJCategory[]) {
    for (const item of list) {
      if (item.categoryId && item.categoryName) {
        map.set(item.categoryId, item.categoryName)
      }
      if (item.categorySecondList) walk(item.categorySecondList)
      if (item.categoryFirstList) walk(item.categoryFirstList)
    }
  }

  walk(json.data || [])
  return map
}

async function buildCategoryCache(): Promise<Map<string, string>> {
  if (categoryCache && categoryCache.size > 0) return categoryCache

  try {
    categoryCache = await fetchAllCategories()
    if (categoryCache.size > 0) return categoryCache
  } catch {
    // fallback to legacy page-1 extraction
  }

  categoryCache = new Map()
  try {
    const { raw } = await legacyFetchPage(1, 200)
    for (const item of raw) {
      if (item.categoryId && item.categoryName && !categoryCache.has(item.categoryId)) {
        categoryCache.set(item.categoryId, item.categoryName)
      }
    }
  } catch {
    // empty is ok
  }

  return categoryCache
}

async function fetchV2Products(params: {
  keyword?: string
  categoryId?: string
  page?: number
  size?: number
  minStock?: number
  productFlag?: number
  orderBy?: number
  features?: string[]
}): Promise<{ products: CJProduct[]; total: number }> {
  const token = await getAccessToken()
  const size = Math.min(params.size || 100, 100)
  const page = params.page || 1

  const searchParams = new URLSearchParams()
  searchParams.set("page", page.toString())
  searchParams.set("size", size.toString())
  if (params.keyword) searchParams.set("keyWord", params.keyword)
  if (params.categoryId) searchParams.set("categoryId", params.categoryId)
  if (params.minStock !== undefined) searchParams.set("startWarehouseInventory", params.minStock.toString())
  if (params.productFlag !== undefined) searchParams.set("productFlag", params.productFlag.toString())
  if (params.orderBy !== undefined) searchParams.set("orderBy", params.orderBy.toString())
  if (params.features?.length) searchParams.set("features", params.features.join(","))

  const url = `${CJ_API_BASE}/product/listV2?${searchParams.toString()}`

  const res = await rateLimitedCjFetch(url, {
    headers: { "CJ-Access-Token": token },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CJ V2 product list failed: ${res.status} ${text}`)
  }

  const json: CJV2Response = await res.json()
  if (!json.success) throw new Error(`CJ V2 product list error: ${json.code}`)

  const rawProducts: CJV2Product[] = []
  for (const content of json.data?.content || []) {
    for (const p of content.productList || []) {
      rawProducts.push(p)
    }
  }

  const products: CJProduct[] = rawProducts.map(mapV2Product)

  return { products, total: json.data?.totalRecords || products.length }
}

function mapV2Product(item: CJV2Product): CJProduct {
  return {
    pid: item.id,
    name: item.nameEn || "",
    englishName: item.nameEn || "",
    image: item.bigImage || "",
    images: item.bigImage ? [item.bigImage] : [],
    variantId: item.sku || item.spu || "",
    sellPrice: parsePrice(item.sellPrice || "0"),
    stock: item.warehouseInventoryNum ?? item.totalVerifiedInventory ?? 0,
    categoryName: item.threeCategoryName || "",
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    description: item.description || "",
  }
}

async function legacyFetchPage(page: number, pageSize: number): Promise<{ products: CJProduct[]; total: number; raw: CJRawProduct[] }> {
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

  const raw = json.data?.list || []
  return {
    products: raw.map(mapLegacyProduct),
    total: json.data?.total || 0,
    raw,
  }
}

function mapLegacyProduct(item: CJRawProduct): CJProduct {
  return {
    pid: item.pid,
    name: item.productName || "",
    englishName: item.productNameEn || "",
    image: item.productImage || "",
    images: item.productImage ? [item.productImage] : [],
    variantId: item.productSku || "",
    sellPrice: parsePrice(item.sellPrice || "0"),
    stock: parseInt(item.warehouseInventoryNum as string) || 0,
    categoryName: item.categoryName || "",
    weight: parseFloat(item.productWeight) || 0,
    length: 0,
    width: 0,
    height: 0,
    description: item.remark || "",
  }
}

export async function fetchCJProducts(params: {
  page?: number
  pageSize?: number
  categoryName?: string
  searchName?: string
} = {}): Promise<{ products: CJProduct[]; total: number }> {
  const keyword = params.searchName?.trim()

  // Use V2 for keyword search (properly supports keyword search + returns stock)
  if (keyword) {
    try {
      const result = await fetchV2Products({
        keyword,
        size: Math.min(params.pageSize || 100, 100),
        minStock: 1,
      })
      if (result.products.length > 0) return result
    } catch {
      // fallback below
    }

    // If V2 fails or returns nothing, try V1 with productNameEn
    try {
      const token = await getAccessToken()
      const url = `${CJ_API_BASE}/product/list?page=${params.page || 1}&pageSize=${Math.min(params.pageSize || 200, 200)}&productNameEn=${encodeURIComponent(keyword)}`
      const res = await rateLimitedCjFetch(url, {
        headers: { "CJ-Access-Token": token },
      })
      if (res.ok) {
        const json: CJResponse = await res.json()
        if (json.success) {
          const raw = json.data?.list || []
          if (raw.length > 0) {
            return {
              products: raw.map(mapLegacyProduct),
              total: raw.length,
            }
          }
        }
      }
    } catch {
      // final fallback below
    }

    // Final fallback: fetch all and filter locally
    const { products } = await legacyFetchPage(params.page || 1, 200)
    const kw = keyword.toLowerCase()
    const filtered = products.filter((p) =>
      p.englishName.toLowerCase().includes(kw) ||
      p.name.toLowerCase().includes(kw) ||
      p.categoryName.toLowerCase().includes(kw)
    )
    return { products: filtered, total: filtered.length }
  }

  // If a category name is specified, find its ID from cache and fetch via V2
  if (params.categoryName) {
    const categories = await buildCategoryCache()
    const cat = params.categoryName.trim().toLowerCase()
    for (const [id, name] of categories) {
      if (name.toLowerCase() === cat || name.toLowerCase().includes(cat)) {
        try {
          const result = await fetchV2Products({
            categoryId: id,
            size: Math.min(params.pageSize || 100, 100),
            minStock: 1,
          })
          if (result.products.length > 0) return result
        } catch {
          // fallback to V1 category fetch
        }
        try {
          const { products } = await legacyFetchCategoryPage(id, Math.min(params.pageSize || 200, 200))
          return { products, total: products.length }
        } catch {
          continue
        }
      }
    }
  }

  // Default: show trending products via V2
  try {
    const result = await fetchV2Products({
      size: Math.min(params.pageSize || 100, 100),
      minStock: 1,
      orderBy: 3,
    })
    if (result.products.length > 0) return result
  } catch {
    // fallback
  }

  const { products } = await legacyFetchPage(params.page || 1, 200)
  return { products, total: products.length }
}

async function legacyFetchCategoryPage(categoryId: string, pageSize: number): Promise<{ products: CJProduct[] }> {
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

  return { products: (json.data?.list || []).map(mapLegacyProduct) }
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
