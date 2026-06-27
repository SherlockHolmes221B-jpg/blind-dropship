import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateAdminForm } from "./create-form"

export default async function TeamPage() {
  const session = await verifySession()

  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Team</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage who has access to the dashboard
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2 font-medium">{admin.name}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{admin.email}</td>
                    <td className="px-3 py-2">
                      {admin.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateAdminForm />
        </CardContent>
      </Card>
    </div>
  )
}
