"use client"

import { useState, useRef, FormEvent } from "react"
import { submitToCJ } from "@/lib/actions/order"
import { Button } from "@/components/ui/button"

export function CJSubmitForm({ orderId }: { orderId: number }) {
  const [message, setMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setMessage(null)
    setSuccess(false)
    try {
      const result = await submitToCJ(orderId)
      if (result.success) {
        setSuccess(true)
        setMessage(`Shipped! Tracking: ${result.trackingNumber || "Pending from CJ"}`)
      } else {
        setSuccess(false)
        setMessage(result.error || "Failed to submit to CJ")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to submit to CJ"
      setSuccess(false)
      setMessage(msg)
    } finally {
      setPending(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="border-t pt-4">
      <Button type="submit" loading={pending}>
        {pending ? "Submitting to CJ..." : "Submit to CJ Dropshipping"}
      </Button>
      {message && (
        <p className={`mt-2 text-sm ${success ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </form>
  )
}
