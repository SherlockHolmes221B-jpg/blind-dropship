import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AnalyticsPage() {
  await verifySession()

  const [aggregate, productStats, supplierStats, monthlyData] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalPrice: true, profit: true } }),
    prisma.order.groupBy({
      by: ["productId"],
      _sum: { totalPrice: true, profit: true, quantity: true },
      orderBy: { _sum: { profit: "desc" } },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ["supplierId"],
      _sum: { totalPrice: true, profit: true },
      orderBy: { _sum: { profit: "desc" } },
      take: 10,
    }),
    prisma.$queryRawUnsafe<Array<{ month: string; revenue: number; profit: number }>>(
      `SELECT strftime('%Y-%m', orderedAt) as month, SUM(totalPrice) as revenue, SUM(profit) as profit FROM "Order" GROUP BY month ORDER BY month DESC LIMIT 12`
    ),
  ])

  const productNames = await prisma.product.findMany({
    where: { id: { in: productStats.map((p) => p.productId).filter((id): id is number => id !== null) } },
    select: { id: true, name: true },
  })
  const productNameMap = new Map(productNames.map((p) => [p.id, p.name]))

  const supplierNames = await prisma.supplier.findMany({
    where: { id: { in: supplierStats.map((s) => s.supplierId).filter((id): id is number => id !== null) } },
    select: { id: true, name: true },
  })
  const supplierNameMap = new Map(supplierNames.map((s) => [s.id, s.name]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Analytics</h1>
        <p className="text-sm text-zinc-500">Profit and performance overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              ${(aggregate._sum.totalPrice || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ${(aggregate._sum.profit || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productStats.map((stat, i) => (
                <div key={stat.productId} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {i + 1}. {productNameMap.get(stat.productId) || `Product #${stat.productId}`}
                  </span>
                  <span className="font-medium">${(stat._sum.profit || 0).toFixed(2)}</span>
                </div>
              ))}
              {productStats.length === 0 && (
                <p className="text-sm text-zinc-400">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers by Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supplierStats.filter((s) => s.supplierId).map((stat, i) => (
                <div key={stat.supplierId} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {i + 1}. {supplierNameMap.get(stat.supplierId!) || `Supplier #${stat.supplierId}`}
                  </span>
                  <span className="font-medium">${(stat._sum.profit || 0).toFixed(2)}</span>
                </div>
              ))}
              {supplierStats.filter((s) => s.supplierId).length === 0 && (
                <p className="text-sm text-zinc-400">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Month</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-500">Revenue</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-500">Profit</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-500">Margin</th>
                </tr>
              </thead>
              <tbody>
                {(monthlyData as any[]).map((row: { month: string; revenue: number; profit: number }) => (
                  <tr key={row.month} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2">{row.month}</td>
                    <td className="px-3 py-2 text-right">${Number(row.revenue).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium text-green-600">
                      ${Number(row.profit).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(row.revenue) > 0
                        ? ((Number(row.profit) / Number(row.revenue)) * 100).toFixed(1) + "%"
                        : "—"}
                    </td>
                  </tr>
                ))}
                {(monthlyData as any[]).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-zinc-400">
                      No data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
