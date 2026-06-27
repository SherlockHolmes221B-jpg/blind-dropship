"use client"

import { useActionState } from "react"
import { markShipped } from "@/lib/actions/order"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function MarkShippedForm({ orderId }: { orderId: number }) {
  const [state, action, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const trackingNumber = formData.get("trackingNumber") as string
      const carrier = formData.get("carrier") as string
      await markShipped(orderId, trackingNumber, carrier)
      return { message: "Marked as shipped" }
    },
    undefined
  )

  return (
    <form action={action} className="flex items-end gap-3 border-t pt-4">
      <div className="flex-1">
        <Input label="Tracking Number" name="trackingNumber" required />
      </div>
      <div className="flex-1">
        <Input label="Carrier" name="carrier" placeholder="UPS, FedEx, USPS..." required />
      </div>
      <Button type="submit" loading={pending}>Mark Shipped</Button>
    </form>
  )
}
