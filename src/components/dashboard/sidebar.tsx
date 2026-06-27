"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/lib/actions/auth"

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/exceptions", label: "Exceptions", icon: "⚠️" },
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/cj-products", label: "CJ Catalog", icon: "🌐" },
  { href: "/orders", label: "Orders", icon: "📋" },
  { href: "/suppliers", label: "Suppliers", icon: "🤝" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/team", label: "Team", icon: "👥" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <Link href="/" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Blind Dropship
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
          >
            <span>🚪</span>
            Logout
          </button>
        </form>
      </div>
    </aside>
  )
}
