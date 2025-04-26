import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "@/server/db";

export const likeRouter = createTRPCRouter({
  likeTrack: protectedProcedure.input(z.object({ trackId: z.string() })).mutation(async ({ input, ctx }) => {
    return prisma.like.upsert({
      where: { userId_trackId: { userId: ctx.session.user.id, trackId: input.trackId } },
      update: {},
      create: { userId: ctx.session.user.id, trackId: input.trackId },
    });
  }),
  unlikeTrack: protectedProcedure.input(z.object({ trackId: z.string() })).mutation(async ({ input, ctx }) => {
    return prisma.like.deleteMany({ where: { userId: ctx.session.user.id, trackId: input.trackId } });
  }),
  getLikedTracks: protectedProcedure.query(async ({ ctx }) => {
    return prisma.like.findMany({
      where: { userId: ctx.session.user.id },
      include: { track: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),
});