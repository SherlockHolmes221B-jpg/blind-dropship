"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { importCJProduct, syncCJProducts } from "@/lib/actions/cj"

interface CJProduct {
  pid: string
  name: string
  englishName: string
  sellPrice: number
  stock: number
  categoryName: string
  image: string
  images: string[]
  weight: number
  variantId: string
}

const RECOMMENDED_CATEGORIES = [
  { keyword: "phone case", label: "Phone Cases", emoji: "📱", desc: "High demand, easy to ship" },
  { keyword: "car accessories", label: "Car Accessories", emoji: "🚗", desc: "Popular with men, good margins" },
  { keyword: "kitchen gadget", label: "Kitchen Gadgets", emoji: "🍳", desc: "Viral potential, impulse buy" },
  { keyword: "pet supplies", label: "Pet Supplies", emoji: "🐾", desc: "Loyal buyers, repeat purchases" },
  { keyword: "beauty tool", label: "Beauty Tools", emoji: "💄", desc: "Trend-driven, high volume" },
  { keyword: "home office", label: "Home Office", emoji: "🏠", desc: "Remote work boom, steady sales" },
  { keyword: "fitness", label: "Fitness & Gym", emoji: "💪", desc: "Year-round demand" },
  { keyword: "storage organizer", label: "Storage & Organizer", emoji: "📦", desc: "Practical, universal appeal" },
  { keyword: "jewelry", label: "Jewelry", emoji: "💍", desc: "High perceived value" },
  { keyword: "baby", label: "Baby & Kids", emoji: "👶", desc: "New parents buy constantly" },
]

export function CJProductImport() {
  const [products, setProducts] = useState<CJProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [importing, setImporting] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const uniqueCategories = [...new Set(products.map((p) => p.categoryName).filter(Boolean))]

  const fetchProducts = useCallback(async (searchTerm?: string, asCategory?: boolean) => {
    setLoading(true)
    setError("")
    setMessage("")
    setCategoryFilter(null)
    try {
      const params = new URLSearchParams({ pageSize: "200" })
      if (searchTerm) {
        params.set(asCategory ? "categoryName" : "searchName", searchTerm)
      }

      const res = await fetch(`/api/cj/products?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch")
      }
      const data = await res.json()
      setProducts(data.products || [])
      if (data.products?.length === 0) {
        setMessage("No products found. Try a different search.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasLoaded) {
      setHasLoaded(true)
      fetchProducts("phone case", true)
      setActiveCategory("phone case")
    }
  }, [hasLoaded, fetchProducts])

  function handleSearch() {
    if (!search.trim()) return
    setActiveCategory(null)
    fetchProducts(search.trim(), false)
  }

  function handleCategoryClick(keyword: string) {
    setSearch(keyword)
    setActiveCategory(keyword)
    fetchProducts(keyword, true)
  }

  async function handleImport(product: CJProduct) {
    setImporting((prev) => new Set(prev).add(product.pid))
    setError("")
    setMessage("")

    const formData = new FormData()
    formData.set("pid", product.pid)
    formData.set("variantId", product.variantId)
    formData.set("name", product.englishName || product.name)
    formData.set("price", (product.sellPrice * 2.5).toString())
    formData.set("cost", product.sellPrice.toString())
    formData.set("image", product.image)
    formData.set("category", product.categoryName)
    formData.set("quantity", product.stock.toString())

    const result = await importCJProduct(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setMessage(`Imported: ${product.englishName || product.name}`)
    }
    setImporting((prev) => {
      const next = new Set(prev)
      next.delete(product.pid)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            🔥 Recommended Products to Sell
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            Proven winning categories. Click any to browse products — import directly to your store.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {RECOMMENDED_CATEGORIES.map((cat) => (
              <button
                key={cat.keyword}
                onClick={() => handleCategoryClick(cat.keyword)}
                className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                  activeCategory === cat.keyword
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                }`}
              >
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{cat.label}</div>
                <div className="mt-1 text-xs text-zinc-500">{cat.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search CJ catalog (e.g. car accessories)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || !search.trim()}>
          {loading ? "Searching..." : "Search"}
        </Button>
        {products.length > 0 && (
          <Button variant="secondary" onClick={() => { setProducts([]); setActiveCategory(null); setSearch("") }}>
            Clear
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {message && !error && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
          {message}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-zinc-500">Loading products...</div>
        </div>
      )}

      {products.length > 0 && !loading && (
        <>
          {uniqueCategories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  !categoryFilter
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                All
              </button>
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {(categoryFilter ? products.filter((p) => p.categoryName === categoryFilter).length : products.length)} products found
              {activeCategory && (
                <span className="ml-1 text-zinc-400">
                  for "<span className="font-medium text-zinc-600 dark:text-zinc-300">{activeCategory}</span>"
                </span>
              )}
            </p>
            <Button variant="secondary" size="sm" onClick={async () => {
              setLoading(true)
              try {
                const toImport = products.map((p) => ({
                  pid: p.pid,
                  variantId: p.variantId,
                  name: p.englishName || p.name,
                  price: p.sellPrice * 2.5,
                  cost: p.sellPrice,
                  image: p.image,
                  category: p.categoryName || "",
                  quantity: p.stock,
                }))
                const result = await syncCJProducts(toImport)
                setMessage(`Imported ${result.imported} products. Skipped ${result.skipped} existing.`)
                if (result.imported > 0) setProducts([])
              } catch (e) {
                setError(e instanceof Error ? e.message : "Import failed")
              } finally {
                setLoading(false)
              }
            }} disabled={loading}>
              Import All to Store
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(categoryFilter ? products.filter((p) => p.categoryName === categoryFilter) : products).map((product) => (
              <Card key={product.pid} className="overflow-hidden">
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.englishName || product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">No image</div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-1 line-clamp-2 text-sm font-medium">
                    {product.englishName || product.name}
                  </h3>
                  <p className="mb-2 text-xs text-zinc-500">{product.categoryName}</p>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      ${product.sellPrice.toFixed(2)}
                    </span>
                    <Badge variant={product.stock > 0 ? "success" : "danger"}>
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </Badge>
                  </div>
                  <div className="mb-3 text-xs text-zinc-500">
                    Est. sell price: <span className="font-semibold text-green-600">${(product.sellPrice * 2.5).toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleImport(product)}
                    disabled={importing.has(product.pid)}
                  >
                    {importing.has(product.pid) ? "Importing..." : "Import to Store"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!loading && products.length === 0 && !message && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500">Choose a category above or search for products</p>
          <p className="mt-1 text-xs text-zinc-400">
            Try: phone case, car accessories, kitchen gadget, pet bowl
          </p>
        </div>
      )}
    </div>
  )
}