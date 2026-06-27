import { redirect } from "next/navigation"
import { getSession } from "@/lib/dal"

export default async function Home() {
  const session = await getSession()
  if (session?.role === "supplier") redirect("/supplier")
  if (!session) redirect("/login")
}
