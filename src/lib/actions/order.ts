"use server"

import { prisma } from "@/lib/prisma"
import { verifySession, getSession } from "@/lib/dal"
import { revalidatePath } from "next/cache"
import { submitCJOrder, lookupCJVariantId, addProductToMyProducts, queryProductVariants, syncCJOrderTracking } from "@/lib/cj-api"

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

  revalidatePath("/orders")
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
  revalidatePath("/orders")
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

  revalidatePath("/orders")
}

export async function submitToCJ(
  orderId: number,
  shipping?: { address: string; city: string; state: string; zip: string; country?: string; phone: string }
): Promise<{ success: boolean; trackingNumber?: string; error?: string }> {
  try {
    await verifySession()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, customer: true },
    })
    if (!order) return { success: false, error: "Order not found" }
    if (order.status !== "pending") return { success: false, error: "Order must be pending" }
    if (!order.product.sku) return { success: false, error: "Product has no CJ SKU" }

    // Ensure product is in CJ "My Products" before ordering
    try {
      await addProductToMyProducts(order.product.sku)
    } catch {
      // non-blocking
    }

    // Find variant vid — try stored vid first, then query API
    let variantVid = order.product.cjVariantVid
    if (!variantVid && order.product.sku) {
      try {
        const variants = await queryProductVariants(order.product.sku)
        if (variants.length > 0) {
          variantVid = variants[0].vid
          await prisma.product.update({
            where: { id: order.product.id },
            data: { cjVariantVid: variantVid },
          })
        }
      } catch {
        // fallback
      }
    }
    if (!variantVid) return { success: false, error: "Could not find CJ variant for this product" }

    const parts = shipping ? null : order.customer.address?.split(", ") || []
    const result = await submitCJOrder({
      variantVid,
      quantity: order.quantity,
      shippingAddress: {
        name: order.customer.name,
        phone: shipping?.phone || order.customer.phone || "0000000000",
        country: shipping?.country || "US",
        state: shipping?.state || parts?.[2] || "",
        city: shipping?.city || parts?.[1] || "",
        address: shipping?.address || parts?.[0] || order.customer.address || "",
        zip: shipping?.zip || parts?.[3] || "",
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "shipped",
        trackingNumber: result.trackingNumber || "",
        shippingCarrier: "CJ Dropshipping",
        cjOrderId: result.orderId || "",
        shippedAt: new Date(),
      },
    })

    revalidatePath("/orders")
    return { success: true, trackingNumber: result.trackingNumber }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown CJ submission error"
    return { success: false, error: msg }
  }
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

  revalidatePath("/orders")
  return { message: "Order created.", orderNumber }
}

export async function refreshCJTracking(orderId: number, cjOrderId: string): Promise<{ trackingNumber?: string; carrier?: string; error?: string }> {
  try {
    await verifySession()

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return { error: "Order not found" }
    if (!cjOrderId) return { error: "No CJ order ID" }

    // Save CJ order ID if not already saved
    if (!order.cjOrderId && cjOrderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { cjOrderId },
      })
    }

    const result = await syncCJOrderTracking(cjOrderId)
    if (!result || !result.trackNumber) return { error: "Tracking not available yet" }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: result.trackNumber,
        shippingCarrier: result.trackingProvider || order.shippingCarrier,
      },
    })

    revalidatePath("/orders")
    revalidatePath(`/orders/${orderId}`)
    return { trackingNumber: result.trackNumber, carrier: result.trackingProvider }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" }
  }
}
