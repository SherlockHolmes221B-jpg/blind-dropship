"use server"

import { prisma } from "@/lib/prisma"
import { verifySession, getSession } from "@/lib/dal"
import { revalidatePath } from "next/cache"

export async function assignSupplier(orderId: number, supplierId: number) {
  const session = await verifySession()

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } })
  if (!supplier) throw new Error("Supplier not found")

  await prisma.order.update({
    where: { id: orderId },
    data: {
      supplierId,
      assignedToId: supplier.userId,
      status: "processing",
    },
  })

  await prisma.activity.create({
    data: {
      userId: session.userId,
      action: "assign_supplier",
      details: `Order #${orderId} assigned to supplier ${supplier.name}`,
    },
  })

  revalidatePath("/dashboard/orders")
}

export async function markShipped(orderId: number, trackingNumber: string, carrier: string) {
  const session = await getSession()
  if (!session) throw new Error("Not authenticated")

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "shipped",
      trackingNumber,
      shippingCarrier: carrier,
      shippedAt: new Date(),
    },
  })

  await prisma.activity.create({
    data: {
      userId: session.userId,
      action: "mark_shipped",
      details: `Order #${orderId} shipped via ${carrier} - ${trackingNumber}`,
    },
  })

  revalidatePath("/supplier")
  revalidatePath("/dashboard/orders")
}

export async function markDelivered(orderId: number) {
  await verifySession()

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  })
  if (!order) throw new Error("Order not found")

  const cost = order.product.cost * order.quantity
  const profit = order.totalPrice - cost - order.shippingCost - order.tax - order.fee

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "delivered", deliveredAt: new Date(), profit },
  })

  revalidatePath("/dashboard/orders")
}

export async function createManualOrder(prevState: unknown, formData: FormData) {
  await verifySession()

  const productId = parseInt(formData.get("productId") as string)
  const customerName = formData.get("customerName") as string
  const customerEmail = formData.get("customerEmail") as string
  const quantity = parseInt(formData.get("quantity") as string) || 1
  const totalPrice = parseFloat(formData.get("totalPrice") as string) || 0

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return { message: "Product not found." }

  let customer = await prisma.customer.findFirst({
    where: { email: customerEmail, name: customerName },
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: customerName, email: customerEmail },
    })
  }

  const orderNumber = `MAN-${Date.now()}`

  await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      productId,
      quantity,
      totalPrice,
      cost: product.cost * quantity,
      status: "pending",
    },
  })

  revalidatePath("/dashboard/orders")
  return { message: "Order created.", orderNumber }
}
