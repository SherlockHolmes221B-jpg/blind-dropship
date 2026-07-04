"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { deleteProduct } from "@/lib/actions/product"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: number
  name: string
  sku: string
  description: string
  price: number
  cost: number
  image: string
  category: string
  quantity: number
  ebayItemId: string
  isActive: boolean
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setProduct(data)
      })
      .catch(() => setError("Failed to load product"))
      .finally(() => setLoading(false))
  }, [id])

  const images = (product?.image || "").split(",").filter(Boolean)

  async function handleSave(formData: FormData) {
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          sku: formData.get("sku"),
          description: formData.get("description"),
          price: parseFloat(formData.get("price") as string),
          cost: parseFloat(formData.get("cost") as string),
          image: formData.get("image"),
          category: formData.get("category"),
          quantity: parseInt(formData.get("quantity") as string) || 0,
          ebayItemId: formData.get("ebayItemId"),
        }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else {
        setProduct(data)
        setMessage("Saved")
      }
    } catch {
      setError("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>
  if (error && !product) return <div className="p-8 text-red-500">{error}</div>
  if (!product) return <div className="p-8 text-zinc-500">Not found</div>

  const suggestedPrice = (product.cost * 2.5).toFixed(2)
  const margin = product.price > 0 ? ((product.price - product.cost) / product.price * 100).toFixed(1) : "0.0"

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{product.name}</h1>
          <p className="text-sm text-zinc-500">
            SKU: {product.sku} &middot;{" "}
            {product.ebayItemId ? (
              <Badge variant="success">Listed</Badge>
            ) : (
              <Badge variant="warning">Not Listed</Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="danger" onClick={async () => {
            await deleteProduct(product.id)
            router.push("/products")
          }}>Delete</Button>
        </div>
      </div>

      {/* eBay Listing Card */}
      <Card>
        <CardHeader>
          <CardTitle>eBay Listing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Images */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Photos ({images.length})
              </h3>
              {images.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((url, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <img
                        src={url}
                        alt={`${product.name} photo ${i + 1}`}
                        className="h-48 w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-all group-hover:bg-black/40">
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-white px-3 py-1 text-xs font-medium text-zinc-800 opacity-0 shadow transition-all group-hover:opacity-100"
                        >
                          Open
                        </a>
                        <button
                          onClick={async () => {
                            const res = await fetch(url)
                            const blob = await res.blob()
                            const a = document.createElement("a")
                            a.href = URL.createObjectURL(blob)
                            a.download = `${product.sku || "product"}-${i + 1}.jpg`
                            a.click()
                            URL.revokeObjectURL(a.href)
                          }}
                          className="rounded bg-white px-3 py-1 text-xs font-medium text-zinc-800 opacity-0 shadow transition-all group-hover:opacity-100"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-400">
                  No images
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500">Title</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Your Price</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">${product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Suggested eBay Price (2.5× cost)</p>
                  <p className="text-xl font-bold text-green-600">${suggestedPrice}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Cost</p>
                  <p className="font-medium">${product.cost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Margin</p>
                  <p className={`font-medium ${parseFloat(margin) >= 30 ? "text-green-600" : "text-yellow-600"}`}>
                    {margin}%
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Category</p>
                <p className="font-medium">{product.category || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Quantity</p>
                <p className="font-medium">{product.quantity}</p>
              </div>
              {product.description && (
                <div>
                  <p className="text-xs text-zinc-500">Description</p>
                  <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={handleSave} className="space-y-4">
            <Input label="Product Name" name="name" defaultValue={product.name} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="SKU" name="sku" defaultValue={product.sku} required />
              <Input label="Category" name="category" defaultValue={product.category} />
            </div>
            <Textarea label="Description" name="description" rows={3} defaultValue={product.description} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Selling Price ($)" name="price" type="number" step="0.01" defaultValue={product.price.toString()} required />
              <Input label="Cost ($)" name="cost" type="number" step="0.01" defaultValue={product.cost.toString()} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Quantity" name="quantity" type="number" defaultValue={product.quantity.toString()} />
              <Input label="eBay Item ID" name="ebayItemId" placeholder="Paste after listing" defaultValue={product.ebayItemId} />
            </div>
            <Input label="Image URL" name="image" placeholder="https://..." defaultValue={product.image} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving}>Save Changes</Button>
              <Button type="button" variant="secondary" onClick={() => {
                const a = document.createElement("a")
                a.href = `/api/products/${id}/ebay-csv`
                a.download = ""
                a.click()
              }}>Download eBay CSV</Button>
              <Button type="button" variant="secondary" onClick={() => router.push("/products")}>Back</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
