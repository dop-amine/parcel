import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminUsers() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          tracks: true,
          dealsAsArtist: true,
          dealsAsExec: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'ARTIST':
        return 'bg-purple-500/10 text-purple-500'
      case 'EXEC':
        return 'bg-blue-500/10 text-blue-500'
      case 'ADMIN':
        return 'bg-green-500/10 text-green-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all platform users
        </p>
      </div>

      <div className="rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Tracks</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Deals</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-800 hover:bg-gray-900/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.profilePicture && (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getRoleColor(user.type)}>
                      {user.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {user._count.tracks}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {user.type === 'ARTIST'
                      ? user._count.dealsAsArtist
                      : user._count.dealsAsExec}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={`/admin/users/${user.id}`}>
                        View Details
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}