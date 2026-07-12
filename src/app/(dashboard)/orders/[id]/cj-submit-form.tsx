"use client"

import { useActionState } from "react"
import { submitToCJ } from "@/lib/actions/order"
import { Button } from "@/components/ui/button"

export function CJSubmitForm({ orderId }: { orderId: number }) {
  const [state, action, pending] = useActionState(
    async (prev: unknown) => {
      try {
        const result = await submitToCJ(orderId)
        return { success: true, message: `Shipped! Tracking: ${result.trackingNumber || "Pending from CJ"}` }
      } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : "Failed to submit to CJ" }
      }
    },
    undefined
  )

  return (
    <form action={action} className="border-t pt-4">
      <Button type="submit" loading={pending}>
        {pending ? "Submitting to CJ..." : "Submit to CJ Dropshipping"}
      </Button>
      {state && (
        <p className={`mt-2 text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
    </form>
  )
}
