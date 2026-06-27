import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/dal"
import { fetchCJProducts, getCJCategories } from "@/lib/cj-api"

export async function GET(request: NextRequest) {
  try {
    await verifySession()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const searchName = searchParams.get("searchName") || undefined
    const categoryName = searchParams.get("categoryName") || undefined

    const result = await fetchCJProducts({ page, pageSize, searchName, categoryName })

    return NextResponse.json(result)
  } catch (error) {
    console.error("CJ API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch CJ products" },
      { status: 500 }
    )
  }
}
