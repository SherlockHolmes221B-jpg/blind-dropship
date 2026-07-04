"use client"

import { use, useActionState } from "react"
import { useRouter } from "next/navigation"
import { updateProduct, deleteProduct } from "@/lib/actions/product"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [state, action, pending] = useActionState(
    (prev: unknown, formData: FormData) => updateProduct(parseInt(id), prev, formData),
    undefined
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Edit Product</h1>
        <p className="text-sm text-zinc-500">Update product information</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form action={action} className="space-y-4">
            <Input label="Product Name" name="name" error={state?.errors?.name?.[0]} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="SKU" name="sku" error={state?.errors?.sku?.[0]} required />
              <Input label="Category" name="category" />
            </div>
            <Textarea label="Description" name="description" rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Selling Price ($)" name="price" type="number" step="0.01" error={state?.errors?.price?.[0]} required />
              <Input label="Cost ($)" name="cost" type="number" step="0.01" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Quantity" name="quantity" type="number" />
              <Input label="eBay Item ID" name="ebayItemId" placeholder="Optional" />
            </div>
            <Input label="Image URL" name="image" placeholder="https://..." />
            {state?.message && <p className="text-sm text-red-500">{state.message}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={pending}>Save Changes</Button>
              <Button type="button" variant="secondary" onClick={() => {
                const a = document.createElement("a")
                a.href = `/api/products/${id}/ebay-csv`
                a.download = ""
                a.click()
              }}>Download eBay CSV</Button>
              <Button type="button" variant="secondary" onClick={() => router.push("/products")}>Cancel</Button>
              <Button type="button" variant="danger" onClick={async () => {
                await deleteProduct(parseInt(id))
                router.push("/products")
              }}>Delete</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
