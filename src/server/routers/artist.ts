import { router, protectedProcedure } from "../trpc";

export const artistRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const userId = ctx.session.user.id;

    const [totalTracks, totalEarnings, totalPlays] = await Promise.all([
      ctx.prisma.track.count({
        where: { userId }
      }),
      ctx.prisma.earning.aggregate({
        where: {
          track: {
            userId
          }
        },
        _sum: {
          amount: true
        }
      }),
      ctx.prisma.play.count({
        where: {
          track: {
            userId
          }
        }
      })
    ]);

    return {
      totalTracks,
      totalEarnings: totalEarnings._sum.amount || 0,
      totalPlays
    };
  })
});