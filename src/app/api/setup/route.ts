import "dotenv/config"
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const adapter = new PrismaPg(process.env.DATABASE_URL!)
    const prisma = new PrismaClient({ adapter })

    const adminPassword = await bcrypt.hash("admin123", 10)

    await prisma.user.upsert({
      where: { email: "admin@blinddropship.com" },
      update: {},
      create: {
        name: "Admin",
        email: "admin@blinddropship.com",
        password: adminPassword,
        role: "admin",
      },
    })

    const partnerPassword = await bcrypt.hash("partner123", 10)

    await prisma.user.upsert({
      where: { email: "partner@blinddropship.com" },
      update: {},
      create: {
        name: "Partner",
        email: "partner@blinddropship.com",
        password: partnerPassword,
        role: "admin",
      },
    })

    const sampleProducts = [
      { name: "Wireless Bluetooth Earbuds", sku: "BT-EBUDS-001", price: 29.99, cost: 12.5, category: "Electronics" },
      { name: "Portable Phone Stand", sku: "PH-STAND-002", price: 14.99, cost: 4.2, category: "Accessories" },
      { name: "LED Desk Lamp", sku: "LED-LAMP-003", price: 39.99, cost: 15.0, category: "Home" },
      { name: "Yoga Mat Premium", sku: "YOGA-MAT-004", price: 24.99, cost: 8.0, category: "Fitness" },
      { name: "USB-C Hub 7-in-1", sku: "USB-HUB-005", price: 34.99, cost: 14.0, category: "Electronics" },
    ]

    for (const product of sampleProducts) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product,
      })
    }

    await prisma.$disconnect()

    return NextResponse.json({ success: true, message: "Database seeded! Accounts: admin@blinddropship.com / admin123 and partner@blinddropship.com / partner123" })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
