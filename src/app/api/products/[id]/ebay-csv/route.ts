import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await verifySession()
  const { id } = await params

  const product = await prisma.product.findUnique({ where: { id: parseInt(id) } })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const price = product.price.toFixed(2)
  const description = (product.description || "").replace(/"/g, '""')
  const images = (product.image || "").split(",").filter(Boolean).join(";")

  const csv = [
    "Title,Format,StartPrice,Quantity,ConditionID,PictureURL,Description",
    `"${product.name}",FixedPrice,${price},${product.quantity || 1},1000,"${images}","${description}"`,
  ].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ebay-${product.sku || product.id}.csv"`,
    },
  })
}
