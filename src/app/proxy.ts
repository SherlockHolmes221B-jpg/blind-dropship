import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"
import { cookies } from "next/headers"

const protectedRoutes = ["/products", "/suppliers", "/orders", "/analytics", "/cj-products", "/supplier", "/exceptions", "/team"]
const publicRoutes = ["/login"]

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  const isProtectedRoute = path === "/" || protectedRoutes.some((route) => path.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route))

  const cookieStore = await cookies()
  const cookie = cookieStore.get("session")?.value
  const session = await decrypt(cookie)

  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (session?.role === "supplier" && path !== "/supplier" && isProtectedRoute) {
    return NextResponse.redirect(new URL("/supplier", req.nextUrl))
  }

  if (session?.role === "admin" && path.startsWith("/supplier")) {
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  if (isPublicRoute && session?.userId) {
    const target = session.role === "supplier" ? "/supplier" : "/dashboard"
    return NextResponse.redirect(new URL(target, req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
