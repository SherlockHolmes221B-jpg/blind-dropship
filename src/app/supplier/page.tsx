import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/dal"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { statusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShipOrderForm } from "./ship-form"
import { logout } from "@/lib/actions/auth"

export default async function SupplierPage() {
  const session = await getSession()
  if (!session || session.role !== "supplier") redirect("/login")

  const supplier = await prisma.supplier.findUnique({
    where: { userId: session.userId },
  })
  if (!supplier) redirect("/login")

  const orders = await prisma.order.findMany({
    where: { supplierId: supplier.id },
    include: { product: true, customer: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Supplier Portal
            </h1>
            <p className="text-sm text-zinc-500">Welcome, {supplier.name}</p>
          </div>
          <form action={logout}>
            <Button type="submit" variant="ghost">Logout</Button>
          </form>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orders.filter((o) => o.status === "processing").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Shipped</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orders.filter((o) => o.status === "shipped").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orders.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">Order {order.orderNumber}</p>
                      <p className="text-sm text-zinc-500">
                        {order.product.name} &times; {order.quantity}
                      </p>
                      <p className="text-sm text-zinc-500">
                        Ship to: {order.customer.name}
                        {order.customer.address && ` — ${order.customer.address}`}
                      </p>
                    </div>
                    {statusBadge(order.status)}
                  </div>

                  {order.status === "processing" && (
                    <ShipOrderForm orderId={order.id} />
                  )}

                  {order.status === "shipped" && (
                    <div className="mt-3 text-sm text-zinc-500">
                      Tracking: {order.trackingNumber} ({order.shippingCarrier})
                    </div>
                  )}
                </div>
              ))}
              {orders.length === 0 && (
                <p className="py-8 text-center text-zinc-400">No orders assigned yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
