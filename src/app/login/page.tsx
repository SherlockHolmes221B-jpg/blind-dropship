"use client"

import { useActionState } from "react"
import { login } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Blind Dropship</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              error={state?.errors?.email?.[0]}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              error={state?.errors?.password?.[0]}
              required
            />
            {state?.message && (
              <p className="text-sm text-red-500">{state.message}</p>
            )}
            <Button type="submit" loading={pending} className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
