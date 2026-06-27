import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("PayPal webhook received:", JSON.stringify(body, null, 2))
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "PayPal webhook endpoint ready" })
}
