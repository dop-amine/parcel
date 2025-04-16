import { router, protectedProcedure } from "../trpc";
import { type Context } from "../trpc";

export const artistRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }: { ctx: Context }) => {
    const userId = ctx.session.user.id;

    const [totalTracks, totalEarnings, totalLicenses] = await Promise.all([
      ctx.prisma.track.count({
        where: { userId }
      }),
      ctx.prisma.purchase.aggregate({
        where: {
          track: {
            userId
          }
        },
        _sum: {
          amount: true
        }
      }),
      ctx.prisma.purchase.count({
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
      totalLicenses
    };
  })
});