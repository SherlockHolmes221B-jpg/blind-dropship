import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { event, orderId, trackingNumber, shippingCarrier, status } = body

    if (!event || !orderId) {
      return NextResponse.json({ error: "Missing event or orderId" }, { status: 400 })
    }

    if (event === "order_shipped" && trackingNumber) {
      const order = await prisma.order.findFirst({
        where: { ebayOrderId: orderId.toString() },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "shipped",
            trackingNumber,
            shippingCarrier: shippingCarrier || "CJ",
            shippedAt: new Date(),
          },
        })
      }
    }

    if (event === "order_delivered") {
      const order = await prisma.order.findFirst({
        where: { ebayOrderId: orderId.toString() },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "delivered",
            deliveredAt: new Date(),
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("CJ webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
