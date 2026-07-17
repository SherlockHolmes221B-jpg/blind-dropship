"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { refreshCJTracking } from "@/lib/actions/order"

export function RefreshTrackingButton({ orderId, hasCjOrderId }: { orderId: number; hasCjOrderId: boolean }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function handleRefresh() {
    setLoading(true)
    setMessage("")
    const result = await refreshCJTracking(orderId)
    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage(`Tracking: ${result.trackingNumber} (${result.carrier || "?"})`)
    }
    setLoading(false)
  }

  if (!hasCjOrderId) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-zinc-500">Check CJ website for tracking, then update it manually.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={loading}>
        {loading ? "Checking..." : "Refresh Tracking from CJ"}
      </Button>
      {message && <p className="text-xs text-zinc-500">{message}</p>}
    </div>
  )
}
