"use client"

import { useActionState } from "react"
import { createAdminUser } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CreateAdminForm() {
  const [state, action, pending] = useActionState(createAdminUser, undefined)

  return (
    <form action={action} className="space-y-4 max-w-md">
      <Input label="Name" name="name" placeholder="Partner's name" error={state?.errors?.name?.[0]} />
      <Input label="Email" name="email" type="email" placeholder="partner@example.com" error={state?.errors?.email?.[0]} />
      <Input label="Password" name="password" type="password" placeholder="At least 6 characters" error={state?.errors?.password?.[0]} />
      {state?.message && (
        <p className={`text-sm ${state.errors ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Add Team Member"}
      </Button>
    </form>
  )
}
