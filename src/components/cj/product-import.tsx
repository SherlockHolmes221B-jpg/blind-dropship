"use client"

import { useState } from "react"
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
}

export function CJProductImport() {
  const [products, setProducts] = useState<CJProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [importing, setImporting] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState("")

  async function fetchProducts() {
    setLoading(true)
    setError("")
    setMessage("")
    try {
      const params = new URLSearchParams({ pageSize: "50" })
      if (search.trim()) params.set("searchName", search.trim())

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
  }

  async function handleImport(product: CJProduct) {
    setImporting((prev) => new Set(prev).add(product.pid))
    setError("")
    setMessage("")

    const formData = new FormData()
    formData.set("pid", product.pid)
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

  async function handleImportAll() {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const toImport = products.map((p) => ({
        pid: p.pid,
        name: p.englishName || p.name,
        price: p.sellPrice * 2.5,
        cost: p.sellPrice,
        image: p.image,
        category: p.categoryName || "",
        quantity: p.stock,
      }))

      const result = await syncCJProducts(toImport)
      setMessage(`Imported ${result.imported} products. Skipped ${result.skipped} existing.`)
      setProducts([])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="Search CJ products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
          className="max-w-md"
        />
        <Button onClick={fetchProducts} disabled={loading}>
          {loading ? "Searching..." : "Search CJ Catalog"}
        </Button>
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

      {products.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">{products.length} products found</p>
            <Button variant="secondary" onClick={handleImportAll} disabled={loading}>
              Import All to Store
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
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
          <p className="text-zinc-500">Search for CJ products above to get started</p>
          <p className="mt-1 text-xs text-zinc-400">
            Try: phone case, kitchen gadget, pet bowl, desk organizer
          </p>
        </div>
      )}
    </div>
  )
}
