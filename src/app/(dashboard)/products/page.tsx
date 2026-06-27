import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ProductsPage() {
  await verifySession()

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Products</h1>
          <p className="text-sm text-zinc-500">Manage your product catalog</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left font-medium text-zinc-500">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Category</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">Price</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">Cost</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">Margin</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">eBay</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const margin = product.price > 0 ? ((product.price - product.cost) / product.price * 100).toFixed(1) : "0.0"
              return (
                <tr key={product.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{product.category || "—"}</td>
                  <td className="px-4 py-3 text-right">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${product.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={parseFloat(margin) >= 30 ? "text-green-600" : "text-yellow-600"}>
                      {margin}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.ebayItemId ? (
                      <Badge variant="success">Listed</Badge>
                    ) : (
                      <Badge variant="warning">Not Listed</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-400">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
