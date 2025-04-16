import { router, protectedProcedure } from "../trpc";
import { type Context } from "../trpc";

interface Track {
  id: string;
  title: string;
  genre: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: Date;
  userId: string;
}

interface TrackWithTimestamp extends Omit<Track, 'createdAt' | 'userId'> {
  createdAt: string;
}

export const trackRouter = router({
  getRecent: protectedProcedure.query(async ({ ctx }: { ctx: Context }) => {
    // Session is guaranteed to exist in protected procedures
    const userId = ctx.session!.user!.id!;

    const tracks = await ctx.prisma.track.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        genre: true,
        status: true,
        createdAt: true,
      },
    });

    return tracks.map((track: Track): TrackWithTimestamp => ({
      id: track.id,
      title: track.title,
      genre: track.genre,
      status: track.status,
      createdAt: track.createdAt.toISOString(),
    }));
  }),
});