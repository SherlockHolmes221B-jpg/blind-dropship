import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { submitCJOrder } from "@/lib/cj-api"

interface ZapierPayload {
  ebayOrderId: string
  ebayItemId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry: string
  quantity: number
  totalPrice: number
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function POST(req: Request) {
  const secret = process.env.ZAPIER_WEBHOOK_SECRET
  if (secret) {
    const auth = req.headers.get("authorization") || req.headers.get("x-webhook-secret")
    if (auth !== secret) return unauthorized()
  }

  try {
    const body: ZapierPayload = await req.json()

    if (!body.ebayOrderId || !body.ebayItemId || !body.customerName) {
      return NextResponse.json({ error: "Missing required fields: ebayOrderId, ebayItemId, customerName" }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: { ebayItemId: body.ebayItemId },
    })
    if (!product) {
      return NextResponse.json({ error: `No product found with eBay Item ID: ${body.ebayItemId}` }, { status: 404 })
    }

    let customer = await prisma.customer.findFirst({
      where: { ebayCustomerId: body.ebayOrderId },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: body.customerName,
          email: body.customerEmail || "",
          phone: body.customerPhone || "",
          address: [body.shippingAddress, body.shippingCity, body.shippingState, body.shippingZip, body.shippingCountry].filter(Boolean).join(", "),
          ebayCustomerId: body.ebayOrderId,
        },
      })
    }

    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber: `EBAY-${body.ebayOrderId}` },
    })
    if (existingOrder) {
      return NextResponse.json({ message: "Order already exists", orderId: existingOrder.id })
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: `EBAY-${body.ebayOrderId}`,
        ebayOrderId: body.ebayOrderId,
        customerId: customer.id,
        productId: product.id,
        quantity: body.quantity || 1,
        totalPrice: body.totalPrice || product.price,
        cost: (product.cost || 0) * (body.quantity || 1),
        status: "pending",
      },
    })

    // Auto-fulfill via CJ if product has CJ IDs
    let cjResult: { orderId?: string; trackingNumber?: string } | null = null
    if (product.sku && product.cjVariantId) {
      const addrParts = (customer.address || "").split(", ")
      try {
        cjResult = await submitCJOrder({
          productId: product.sku,
          variantId: product.cjVariantId,
          quantity: body.quantity || 1,
          shippingAddress: {
            name: customer.name,
            phone: customer.phone || "0000000000",
            country: body.shippingCountry || "US",
            state: body.shippingState || "",
            city: body.shippingCity || "",
            address: body.shippingAddress || "",
            zip: body.shippingZip || "",
          },
        })

        if (cjResult) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "shipped",
              trackingNumber: cjResult.trackingNumber || "",
              shippingCarrier: "CJ Dropshipping",
              shippedAt: new Date(),
            },
          })
        }
      } catch (e) {
        console.error("CJ fulfillment failed:", e)
        // Order stays as "pending" — user can retry manually
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      fulfilled: !!cjResult,
    })
  } catch (e) {
    console.error("eBay webhook error:", e)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "eBay webhook endpoint ready. POST order data from Zapier." })
}
