import { createTRPCRouter, protectedProcedure } from "../trpc";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const trackRouter = createTRPCRouter({
  getRecent: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return prisma.track.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  }),

  upload: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        fileUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Create the track record
      const track = await prisma.track.create({
        data: {
          title: input.title,
          description: input.description,
          audioUrl: input.fileUrl,
          userId,
        },
      });

      return track;
    }),
});