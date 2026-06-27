import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function SuppliersPage() {
  await verifySession()

  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Suppliers</h1>
          <p className="text-sm text-zinc-500">Manage your dropshipping suppliers</p>
        </div>
        <Link href="/dashboard/suppliers/new">
          <Button>Add Supplier</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Contact</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Lead Time</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">Blind Ship</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">Orders</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">{supplier.name}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {supplier.email && <div>{supplier.email}</div>}
                  {supplier.phone && <div className="text-xs">{supplier.phone}</div>}
                </td>
                <td className="px-4 py-3">{supplier.leadTime} days</td>
                <td className="px-4 py-3 text-center">
                  {supplier.blindShip ? <Badge variant="success">Yes</Badge> : <Badge variant="warning">No</Badge>}
                </td>
                <td className="px-4 py-3 text-right">{supplier._count.orders}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/suppliers/${supplier.id}`}
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                  No suppliers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
