"use server"

import { prisma } from "@/lib/prisma"
import { SupplierFormSchema } from "@/lib/definitions"
import { verifySession } from "@/lib/dal"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

export async function createSupplier(prevState: unknown, formData: FormData) {
  await verifySession()

  const validatedFields = SupplierFormSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    leadTime: formData.get("leadTime"),
    blindShip: formData.get("blindShip") === "on",
    notes: formData.get("notes"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields.",
    }
  }

  const data = validatedFields.data
  const password = Math.random().toString(36).slice(-8)
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email || `${data.name.toLowerCase().replace(/\s+/g, ".")}@supplier.local`,
      password: hashedPassword,
      role: "supplier",
      supplier: {
        create: data,
      },
    },
    include: { supplier: true },
  })

  revalidatePath("/dashboard/suppliers")
  return { message: "Supplier created. Temporary password: " + password }
}

export async function updateSupplier(id: number, prevState: unknown, formData: FormData) {
  await verifySession()

  const validatedFields = SupplierFormSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    leadTime: formData.get("leadTime"),
    blindShip: formData.get("blindShip") === "on",
    notes: formData.get("notes"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields.",
    }
  }

  const data = validatedFields.data
  await prisma.supplier.update({ where: { id }, data })
  revalidatePath("/dashboard/suppliers")
  redirect("/dashboard/suppliers")
}

export async function deleteSupplier(id: number) {
  await verifySession()
  await prisma.supplier.update({ where: { id }, data: { isActive: false } })
  revalidatePath("/dashboard/suppliers")
}
