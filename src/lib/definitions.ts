import * as z from "zod"

export const LoginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(1, { message: "Password is required" }),
})

export const ProductFormSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  description: z.string().default(""),
  sku: z.string().min(1, { message: "SKU is required" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  cost: z.coerce.number().min(0).default(0),
  category: z.string().default(""),
  quantity: z.coerce.number().int().min(0).default(0),
  image: z.string().default(""),
  ebayItemId: z.string().default(""),
})

export const SupplierFormSchema = z.object({
  name: z.string().min(1, { message: "Supplier name is required" }),
  contactName: z.string().default(""),
  email: z.string().email().or(z.literal("")).default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  leadTime: z.coerce.number().int().min(1).default(3),
  blindShip: z.boolean().default(true),
  notes: z.string().default(""),
})

export const SupplierSignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
})

export const AdminUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export type FormState =
  | {
      errors?: Record<string, string[] | undefined>
      message?: string
    }
  | undefined

export type LoginFormState =
  | {
      errors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined
