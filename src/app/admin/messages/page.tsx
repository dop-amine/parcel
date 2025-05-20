import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminMessages() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const deals = await prisma.deal.findMany({
    include: {
      track: {
        select: {
          title: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      artist: {
        select: {
          name: true,
          email: true,
        },
      },
      exec: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'COUNTERED':
        return 'bg-blue-500/10 text-blue-500'
      case 'ACCEPTED':
        return 'bg-green-500/10 text-green-500'
      case 'DECLINED':
        return 'bg-red-500/10 text-red-500'
      case 'CANCELLED':
        return 'bg-gray-500/10 text-gray-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Deal Management</h1>
        <p className="text-muted-foreground">
          Manage and monitor all licensing deals
        </p>
      </div>

      <div className="rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Track</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Artist</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Executive</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Last Updated</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-gray-800 hover:bg-gray-900/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{deal.track.title}</p>
                      <p className="text-xs text-gray-400">
                        by {deal.track.user.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm">{deal.artist.name}</p>
                      <p className="text-xs text-gray-400">{deal.artist.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm">{deal.exec.name}</p>
                      <p className="text-xs text-gray-400">{deal.exec.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(deal.state)}>
                      {deal.state}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDistanceToNow(deal.updatedAt, { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={`/admin/messages/${deal.id}`}>
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