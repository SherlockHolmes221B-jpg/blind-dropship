import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

async function getExceptions() {
  const unlisted = await prisma.product.findMany({
    where: { isActive: true, ebayItemId: "" },
    take: 20,
    orderBy: { createdAt: "desc" },
  })

  const noCost = await prisma.product.findMany({
    where: { isActive: true, cost: 0 },
    take: 20,
  })

  const lowMargin = await prisma.product.findMany({
    where: { isActive: true, cost: { gt: 0 } },
    take: 20,
  }).then(products => products.filter(p => p.cost > 0 && p.price < p.cost * 1.3))

  const unassigned = await prisma.order.findMany({
    where: { status: "pending", supplierId: null },
    include: { product: true, customer: true },
    take: 20,
    orderBy: { orderedAt: "desc" },
  })

  const outOfStock = await prisma.product.findMany({
    where: { isActive: true, quantity: 0 },
    take: 20,
  })

  return { unlisted, noCost, lowMargin, unassigned, outOfStock }
}

export default async function ExceptionsPage() {
  await verifySession()
  const { unlisted, noCost, lowMargin, unassigned, outOfStock } = await getExceptions()

  const totalIssues = unlisted.length + noCost.length + lowMargin.length + unassigned.length + outOfStock.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Exceptions</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {totalIssues} item{totalIssues !== 1 ? "s" : ""} needing review
        </p>
      </div>

      {totalIssues === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-zinc-400">
            <p className="text-lg">All clear! No exceptions to review.</p>
            <p className="text-sm mt-1">Everything is running smoothly.</p>
          </CardContent>
        </Card>
      )}

      {unlisted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Products Not on eBay
              <Badge variant="warning">{unlisted.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unlisted.map(p => (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-zinc-500">{p.sku}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {noCost.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Products Missing Cost
              <Badge variant="warning">{noCost.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {noCost.map(p => (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-zinc-500">${p.price.toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {lowMargin.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Low Margin Products
              <Badge variant="danger">{lowMargin.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowMargin.map(p => {
                const margin = ((p.price - p.cost) / p.price * 100).toFixed(1)
                return (
                  <Link key={p.id} href={`/products/${p.id}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-red-600 dark:text-red-400">{margin}% margin</span>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {unassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Unassigned Orders
              <Badge variant="danger">{unassigned.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unassigned.map(o => (
                <Link key={o.id} href={`/orders/${o.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <div>
                    <span className="font-medium">{o.orderNumber}</span>
                    <span className="ml-2 text-zinc-500">{o.product.name}</span>
                  </div>
                  <span className="text-zinc-500">{o.customer.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {outOfStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Out of Stock Products
              <Badge variant="warning">{outOfStock.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {outOfStock.map(p => (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-zinc-500">{p.sku}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
