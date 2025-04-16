import { router, protectedProcedure } from "../trpc";

interface Track {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  coverUrl: string | null;
  createdAt: Date;
  userId: string;
}

interface TrackWithTimestamp extends Omit<Track, 'createdAt' | 'userId'> {
  createdAt: string;
}

export const trackRouter = router({
  getRecent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const userId = ctx.session.user.id;

    const tracks = await ctx.prisma.track.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        audioUrl: true,
        coverUrl: true,
        createdAt: true,
      },
    });

    return tracks.map((track): TrackWithTimestamp => ({
      id: track.id,
      title: track.title,
      description: track.description,
      audioUrl: track.audioUrl,
      coverUrl: track.coverUrl,
      createdAt: track.createdAt.toISOString(),
    }));
  }),
});