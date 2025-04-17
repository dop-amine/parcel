import { createTRPCRouter, protectedProcedure } from "../trpc";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const trackRouter = createTRPCRouter({
  getRecent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to view your tracks",
      });
    }

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
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to upload tracks",
        });
      }

      if (ctx.session.user.role !== "ARTIST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only artists can upload tracks",
        });
      }

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