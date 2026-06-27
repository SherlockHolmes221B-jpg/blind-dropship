"use server"

import { prisma } from "@/lib/prisma"
import { ProductFormSchema } from "@/lib/definitions"
import { verifySession } from "@/lib/dal"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProduct(prevState: unknown, formData: FormData) {
  await verifySession()

  const validatedFields = ProductFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    sku: formData.get("sku"),
    price: formData.get("price"),
    cost: formData.get("cost"),
    category: formData.get("category"),
    quantity: formData.get("quantity"),
    image: formData.get("image"),
    ebayItemId: formData.get("ebayItemId"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields.",
    }
  }

  const data = validatedFields.data

  await prisma.product.create({ data })
  revalidatePath("/dashboard/products")
  redirect("/dashboard/products")
}

export async function updateProduct(id: number, prevState: unknown, formData: FormData) {
  await verifySession()

  const validatedFields = ProductFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    sku: formData.get("sku"),
    price: formData.get("price"),
    cost: formData.get("cost"),
    category: formData.get("category"),
    quantity: formData.get("quantity"),
    image: formData.get("image"),
    ebayItemId: formData.get("ebayItemId"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields.",
    }
  }

  const data = validatedFields.data

  await prisma.product.update({ where: { id }, data })
  revalidatePath("/dashboard/products")
  redirect("/dashboard/products")
}

export async function deleteProduct(id: number) {
  await verifySession()
  await prisma.product.update({ where: { id }, data: { isActive: false } })
  revalidatePath("/dashboard/products")
}
