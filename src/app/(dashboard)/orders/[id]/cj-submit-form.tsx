"use client"

import { useState, FormEvent } from "react"
import { submitToCJ } from "@/lib/actions/order"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CJSubmitForm({ orderId }: { orderId: number }) {
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [country, setCountry] = useState("US")
  const [phone, setPhone] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!showForm) {
      setShowForm(true)
      return
    }
    setPending(true)
    setMessage(null)
    setSuccess(false)
    try {
      const result = await submitToCJ(orderId, { address, city, state, zip, country, phone })
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

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="border-t pt-4 space-y-3">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Shipping Address for CJ</p>
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <div className="grid grid-cols-3 gap-3">
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} required />
          <Input label="State" value={state} onChange={(e) => setState(e.target.value)} required />
          <Input label="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <Button type="submit" loading={pending}>
          {pending ? "Submitting to CJ..." : "Submit Order to CJ"}
        </Button>
        {message && (
          <p className={`text-sm ${success ? "text-green-600" : "text-red-600"}`}>{message}</p>
        )}
      </form>
    )
  }

  return (
    <div className="border-t pt-4">
      <Button type="button" onClick={handleSubmit}>
        Submit to CJ Dropshipping
      </Button>
      {message && (
        <p className={`mt-2 text-sm ${success ? "text-green-600" : "text-red-600"}`}>{message}</p>
      )}
    </div>
  )
}
