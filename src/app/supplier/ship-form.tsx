"use client"

import { useActionState } from "react"
import { markShipped } from "@/lib/actions/order"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ShipOrderForm({ orderId }: { orderId: number }) {
  const [state, action, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const trackingNumber = formData.get("trackingNumber") as string
      const carrier = formData.get("carrier") as string
      await markShipped(orderId, trackingNumber, carrier)
      return { message: "Shipped!" }
    },
    undefined
  )

  return (
    <form action={action} className="mt-3 flex items-end gap-3">
      <div className="flex-1">
        <Input name="trackingNumber" placeholder="Tracking #" required />
      </div>
      <div className="flex-1">
        <Input name="carrier" placeholder="Carrier (UPS, FedEx...)" required />
      </div>
      <Button type="submit" loading={pending} size="sm">Mark Shipped</Button>
    </form>
  )
}
