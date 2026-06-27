"use server"

import { prisma } from "@/lib/prisma"
import { LoginFormSchema, SupplierSignupSchema } from "@/lib/definitions"
import { createSession, deleteSession } from "@/lib/session"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

export async function login(prevState: unknown, formData: FormData) {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields.",
    }
  }

  const { email, password } = validatedFields.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    return { message: "Invalid email or password." }
  }

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    return { message: "Invalid email or password." }
  }

  await createSession(user.id, user.role)

  if (user.role === "supplier") {
    redirect("/supplier")
  }
  redirect("/")
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}

export async function createSupplierAccount(prevState: unknown, formData: FormData) {
  const validatedFields = SupplierSignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields.",
    }
  }

  const { name, email, password } = validatedFields.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { message: "Email already in use." }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "supplier",
      supplier: {
        create: {
          name,
          contactName: name,
          email,
        },
      },
    },
  })

  return { message: "Supplier account created successfully." }
}
