"use client"

import { useActionState } from "react"
import { createSupplier } from "@/lib/actions/supplier"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function NewSupplierPage() {
  const [state, action, pending] = useActionState(createSupplier, undefined)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Supplier</h1>
        <p className="text-sm text-zinc-500">Add a new dropshipping supplier</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form action={action} className="space-y-4">
            <Input label="Company Name" name="name" error={state?.errors?.name?.[0]} required />
            <Input label="Contact Name" name="contactName" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" name="email" type="email" />
              <Input label="Phone" name="phone" />
            </div>
            <Input label="Address" name="address" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Lead Time (days)" name="leadTime" type="number" defaultValue="3" />
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="blindShip" defaultChecked className="rounded" />
                  Blind Shipping
                </label>
              </div>
            </div>
            <Textarea label="Notes" name="notes" rows={2} />
            {state?.message && (
              <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {state.message}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={pending}>Create Supplier</Button>
              <Button type="button" variant="secondary" onClick={() => window.history.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
