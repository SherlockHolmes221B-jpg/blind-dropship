import { HTMLAttributes, forwardRef } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 ${hover ? "hover:shadow-md transition-shadow" : ""} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

export const CardHeader = ({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
)

export const CardTitle = ({ className = "", children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold text-zinc-900 dark:text-zinc-100 ${className}`} {...props}>
    {children}
  </h3>
)

export const CardDescription = ({ className = "", children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`} {...props}>
    {children}
  </p>
)

export const CardContent = ({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props}>
    {children}
  </div>
)
