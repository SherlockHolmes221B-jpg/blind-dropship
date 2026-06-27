interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}

const variants = {
  default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function statusBadge(status: string) {
  const map: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    pending: { variant: "warning", label: "Pending" },
    processing: { variant: "info", label: "Processing" },
    shipped: { variant: "info", label: "Shipped" },
    delivered: { variant: "success", label: "Delivered" },
    cancelled: { variant: "danger", label: "Cancelled" },
    refunded: { variant: "danger", label: "Refunded" },
  }
  const s = map[status] || { variant: "default" as const, label: status }
  return <Badge variant={s.variant}>{s.label}</Badge>
}
