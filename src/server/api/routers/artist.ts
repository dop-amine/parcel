import { createTRPCRouter, protectedProcedure } from "../trpc";
import prisma from "@/lib/prisma";

export const artistRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const totalTracks = await prisma.track.count({
      where: { userId },
    });

    const totalPlays = await prisma.play.count({
      where: {
        track: {
          userId,
        },
      },
    });

    const totalEarnings = await prisma.earning.aggregate({
      where: {
        track: {
          userId,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalTracks,
      totalPlays,
      totalEarnings: totalEarnings._sum.amount || 0,
    };
  }),
});