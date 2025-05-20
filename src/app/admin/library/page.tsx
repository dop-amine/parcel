import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function AdminLibrary() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const playlists = await prisma.playlist.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      tracks: {
        include: {
          track: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Playlists</h1>
          <p className="text-muted-foreground">
            Manage your playlists for sharing with executives
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/library/new">
            <Plus className="mr-2 h-4 w-4" />
            New Playlist
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 p-4"
          >
            <div className="mb-4">
              <h3 className="text-lg font-medium">{playlist.name}</h3>
              <p className="text-sm text-gray-400">
                {playlist.tracks.length} tracks
              </p>
            </div>

            <div className="space-y-2">
              {playlist.tracks.slice(0, 3).map(({ track }) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between rounded bg-gray-800/50 p-2"
                >
                  <div className="flex-1 truncate">
                    <p className="truncate text-sm">{track.title}</p>
                    <p className="truncate text-xs text-gray-400">
                      {track.user.name}
                    </p>
                  </div>
                </div>
              ))}
              {playlist.tracks.length > 3 && (
                <p className="text-sm text-gray-400">
                  +{playlist.tracks.length - 3} more tracks
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <Link href={`/admin/library/${playlist.id}`}>
                  View Details
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
                onClick={() => {/* TODO: Implement delete */}}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}