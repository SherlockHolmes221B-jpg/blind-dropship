import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { statusBadge } from "@/components/ui/badge"
import { AssignSupplierForm } from "./assign-form"
import { MarkShippedForm } from "./ship-form"
import { CJSubmitForm } from "./cj-submit-form"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession()
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: { product: true, customer: true, supplier: true, assignedTo: true },
  })

  if (!order) notFound()

  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Order {order.orderNumber}</h1>
          <p className="text-sm text-zinc-500">{statusBadge(order.status)}</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Name</span>
              <span className="font-medium">{order.product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">SKU</span>
              <span className="font-mono">{order.product.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Quantity</span>
              <span>{order.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Price</span>
              <span>${order.totalPrice.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Name</span>
              <span className="font-medium">{order.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Email</span>
              <span>{order.customer.email || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fulfillment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Supplier</p>
              <p className="font-medium">{order.supplier?.name || "Not assigned"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Tracking</p>
              <p className="font-medium">{order.trackingNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Carrier</p>
              <p className="font-medium">{order.shippingCarrier || "—"}</p>
            </div>
          </div>

          {order.status === "pending" && (
            <>
              {order.product.sku && <CJSubmitForm orderId={order.id} />}
              <AssignSupplierForm orderId={order.id} suppliers={suppliers} />
            </>
          )}

          {order.status === "processing" && (
            <MarkShippedForm orderId={order.id} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
