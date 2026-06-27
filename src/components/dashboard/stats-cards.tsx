import { Card, CardContent } from "@/components/ui/card"

interface Stat {
  title: string
  value: string
  change?: string
  icon: string
}

export function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.title}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
              {stat.change && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">{stat.change}</p>
              )}
            </div>
            <span className="text-2xl">{stat.icon}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
