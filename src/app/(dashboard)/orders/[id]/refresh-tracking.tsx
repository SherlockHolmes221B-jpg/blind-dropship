"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { refreshCJTracking } from "@/lib/actions/order"

export function RefreshTrackingButton({ orderId, savedCjOrderId }: { orderId: number; savedCjOrderId: string }) {
  const [loading, setLoading] = useState(false)
  const [cjOrderId, setCjOrderId] = useState(savedCjOrderId)
  const [message, setMessage] = useState("")

  async function handleRefresh() {
    if (!cjOrderId.trim()) {
      setMessage("Enter the CJ Order ID first")
      return
    }
    setLoading(true)
    setMessage("")
    const result = await refreshCJTracking(orderId, cjOrderId.trim())
    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage(`Tracking: ${result.trackingNumber} (${result.carrier || "?"})`)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      {!savedCjOrderId && (
        <div className="flex gap-2">
          <Input
            placeholder="Paste CJ Order ID here..."
            value={cjOrderId}
            onChange={(e) => setCjOrderId(e.target.value)}
            className="max-w-xs"
          />
        </div>
      )}
      <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={loading}>
        {loading ? "Checking..." : "Refresh Tracking from CJ"}
      </Button>
      {message && <p className="text-xs text-zinc-500">{message}</p>}
    </div>
  )
}
