import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { Button } from "@/components/ui/button"
import { statusBadge } from "@/components/ui/badge"

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await verifySession()
  const { status } = await searchParams

  const where = status && status !== "all" ? { status } : {}

  const orders = await prisma.order.findMany({
    where,
    include: { product: true, customer: true, supplier: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Orders</h1>
          <p className="text-sm text-zinc-500">Track and manage orders</p>
        </div>
        <div className="flex gap-2">
          {["all", "pending", "processing", "shipped", "delivered"].map((s) => (
            <Link key={s} href={s === "all" ? "/dashboard/orders" : `?status=${s}`}>
              <Button variant={(!status && s === "all") || status === s ? "primary" : "secondary"} size="sm">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Order #</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Product</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Supplier</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">Status</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">Total</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">Profit</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/orders/${order.id}`} className="font-medium hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{order.product.name}</td>
                <td className="px-4 py-3">{order.customer.name}</td>
                <td className="px-4 py-3 text-zinc-500">{order.supplier?.name || "—"}</td>
                <td className="px-4 py-3 text-center">{statusBadge(order.status)}</td>
                <td className="px-4 py-3 text-right">${order.totalPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">
                  ${order.profit.toFixed(2)}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
