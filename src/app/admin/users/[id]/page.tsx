import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Deal, Track, User } from '@prisma/client'
import { getTierBadgeClass, getTierInfo } from '@/utils/tiers'
import { UserTier } from '@/types/deal'

type DealWithRelations = Deal & {
  track: Track
  artist: User
  exec: User
}

type UserWithRelations = User & {
  tracks: Track[]
  dealsAsArtist: DealWithRelations[]
  dealsAsExec: DealWithRelations[]
}

export default async function UserDetails({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      tracks: {
        orderBy: { createdAt: 'desc' },
      },
      dealsAsArtist: {
        include: {
          track: true,
          exec: true,
        },
        orderBy: { updatedAt: 'desc' },
      },
      dealsAsExec: {
        include: {
          track: true,
          artist: true,
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  }) as UserWithRelations | null

  if (!user) {
    notFound()
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="text-muted-foreground">
            View and manage user information
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/users">Back to Users</Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {user.profilePicture && (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-lg font-medium">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Role</p>
                <Badge className={getRoleColor(user.type)}>
                  {user.type}
                </Badge>
                {user.tier && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">Tier</p>
                    <Badge className={getTierBadgeClass(user.tier as UserTier)}>
                      {getTierInfo(user.tier as UserTier).name}
                    </Badge>
                    <div className="text-xs text-gray-400 mt-1">
                      {getTierInfo(user.tier as UserTier).description}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">Joined</p>
                <p className="text-sm">
                  {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Total Tracks</p>
                <p className="text-2xl font-semibold">{user.tracks.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Deals</p>
                <p className="text-2xl font-semibold">
                  {user.type === 'ARTIST'
                    ? user.dealsAsArtist.length
                    : user.dealsAsExec.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {user.type === 'ARTIST' ? 'Artist Deals' : 'Executive Deals'}
            </h2>
            <div className="space-y-4">
              {(user.type === 'ARTIST' ? user.dealsAsArtist : user.dealsAsExec).map(
                (deal: DealWithRelations) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between rounded-lg border border-gray-800 p-4"
                  >
                    <div>
                      <p className="font-medium">{deal.track.title}</p>
                      <p className="text-sm text-gray-400">
                        {user.type === 'ARTIST'
                          ? `with ${deal.exec.name}`
                          : `with ${deal.artist.name}`}
                      </p>
                    </div>
                    <Badge
                      className={
                        deal.state === 'ACCEPTED'
                          ? 'bg-green-500/10 text-green-500'
                          : deal.state === 'PENDING'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500'
                      }
                    >
                      {deal.state}
                    </Badge>
                  </div>
                )
              )}
            </div>
          </div>

          {user.type === 'ARTIST' && (
            <div className="rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Tracks</h2>
              <div className="space-y-4">
                {user.tracks.map((track: Track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between rounded-lg border border-gray-800 p-4"
                  >
                    <div>
                      <p className="font-medium">{track.title}</p>
                      <p className="text-sm text-gray-400">
                        {formatDistanceToNow(track.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/tracks/${track.id}`}>View Track</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}