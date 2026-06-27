"use server"

import { prisma } from "@/lib/prisma"
import { AdminUserSchema, type FormState } from "@/lib/definitions"
import { verifySession } from "@/lib/dal"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createAdminUser(prevState: FormState, formData: FormData) {
  const session = await verifySession()
  if (!session || session.role !== "admin") {
    return { message: "Not authorized" }
  }

  const validated = AdminUserSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, email, password } = validated.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { message: "A user with this email already exists" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { name, email, password: hashedPassword, role: "admin" } })

  revalidatePath("/team")
  return { message: `Admin account created for ${name}` }
}

export async function deactivateUser(userId: number) {
  const session = await verifySession()
  if (!session || session.role !== "admin") {
    return { message: "Not authorized" }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  })

  revalidatePath("/team")
}
