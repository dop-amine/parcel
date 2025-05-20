import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import TrackCard from '@/components/TrackCard'

export default async function AdminExplore() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const tracks = await prisma.track.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profilePicture: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const formattedTracks = tracks.map(track => ({
    ...track,
    artist: {
      id: track.user.id,
      name: track.user.name,
      profilePicture: track.user.profilePicture,
    },
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">All Tracks</h1>
        <p className="text-muted-foreground">
          View and manage all tracks in the platform
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {formattedTracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            isAdmin
          />
        ))}
      </div>
    </div>
  )
}