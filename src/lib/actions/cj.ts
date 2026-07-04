"use server"

import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { revalidatePath } from "next/cache"

export async function importCJProduct(formData: FormData) {
  await verifySession()

  const pid = formData.get("pid") as string
  const variantId = formData.get("variantId") as string
  const name = formData.get("name") as string
  const price = parseFloat(formData.get("price") as string)
  const cost = parseFloat(formData.get("cost") as string)
  const image = formData.get("image") as string
  const category = formData.get("category") as string
  const quantity = parseInt(formData.get("quantity") as string) || 0

  if (!pid || !name || isNaN(price)) {
    return { error: "Missing required fields" }
  }

  const existing = await prisma.product.findUnique({ where: { sku: pid } })
  if (existing) {
    return { error: `Product ${pid} already exists as "${existing.name}"` }
  }

  await prisma.product.create({
    data: {
      name,
      sku: pid,
      cjVariantId: variantId,
      price,
      cost: isNaN(cost) ? 0 : cost,
      image,
      category,
      quantity,
      description: "",
    },
  })

  revalidatePath("/cj-products")
  return { success: true }
}

export async function syncCJProducts(products: {
  pid: string
  variantId: string
  name: string
  price: number
  cost: number
  image: string
  category: string
  quantity: number
}[]) {
  await verifySession()

  let imported = 0
  let skipped = 0

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { sku: p.pid } })
    if (existing) {
      skipped++
      continue
    }

    await prisma.product.create({
      data: {
        name: p.name,
        sku: p.pid,
        cjVariantId: p.variantId,
        price: p.price,
        cost: p.cost,
        image: p.image,
        category: p.category,
        quantity: p.quantity,
      },
    })
    imported++
  }

  revalidatePath("/cj-products")
  return { imported, skipped }
}
