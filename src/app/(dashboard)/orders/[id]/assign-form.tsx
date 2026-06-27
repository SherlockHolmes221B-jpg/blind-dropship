"use client"

import { useActionState } from "react"
import { assignSupplier } from "@/lib/actions/order"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"

interface Supplier {
  id: number
  name: string
}

export function AssignSupplierForm({ orderId, suppliers }: { orderId: number; suppliers: Supplier[] }) {
  const [state, action, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const supplierId = parseInt(formData.get("supplierId") as string)
      await assignSupplier(orderId, supplierId)
      return { message: "Supplier assigned" }
    },
    undefined
  )

  return (
    <form action={action} className="flex items-end gap-3 border-t pt-4">
      <div className="flex-1">
        <Select
          name="supplierId"
          label="Assign to Supplier"
          placeholder="Select a supplier..."
          options={suppliers.map((s) => ({ value: s.id.toString(), label: s.name }))}
          required
        />
      </div>
      <Button type="submit" loading={pending}>Assign</Button>
    </form>
  )
}
