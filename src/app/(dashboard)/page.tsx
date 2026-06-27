import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, statusBadge } from "@/components/ui/badge"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await verifySession()

  const [
    totalProducts,
    listedOnEbay,
    totalSuppliers,
    pendingOrders,
    unassignedOrders,
    processingOrders,
    totalOrders,
    shippedOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, ebayItemId: { not: "" } } }),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: "pending", supplierId: null } }),
    prisma.order.count({ where: { status: "processing" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["shipped", "delivered"] } } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { product: true, customer: true, supplier: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Welcome back, {session.role === "admin" ? "Admin" : "User"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalProducts} products
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {listedOnEbay} on eBay · {totalProducts - listedOnEbay} need listing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalOrders} total
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {unassignedOrders} unassigned · {processingOrders} processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalSuppliers}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Active suppliers ready to fulfill
            </p>
          </CardContent>
        </Card>

        <Link href="/exceptions">
          <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Needs Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {unassignedOrders + (totalProducts - listedOnEbay)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Click to view exceptions
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {unassignedOrders > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              ⚠️ {unassignedOrders} order{unassignedOrders !== 1 ? "s" : ""} need supplier assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/orders"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Go to Orders →
            </Link>
          </CardContent>
        </Card>
      )}

      {(totalProducts - listedOnEbay) > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              📦 {totalProducts - listedOnEbay} product{(totalProducts - listedOnEbay) !== 1 ? "s" : ""} not listed on eBay yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/products"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Go to Products →
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Order</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Product</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Customer</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2 font-medium">{order.orderNumber}</td>
                    <td className="px-3 py-2">{order.product.name}</td>
                    <td className="px-3 py-2">{order.customer.name}</td>
                    <td className="px-3 py-2">{statusBadge(order.status)}</td>
                    <td className="px-3 py-2 text-right">${order.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-zinc-400">
                      No orders yet. Import products from CJ Catalog to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
