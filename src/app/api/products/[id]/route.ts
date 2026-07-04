import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await verifySession()
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id: parseInt(id) } })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await verifySession()
  const { id } = await params
  const body = await req.json()

  const product = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      sku: body.sku,
      description: body.description || "",
      price: body.price,
      cost: body.cost || 0,
      image: body.image || "",
      category: body.category || "",
      quantity: body.quantity || 0,
      ebayItemId: body.ebayItemId || "",
    },
  })

  return NextResponse.json(product)
}
