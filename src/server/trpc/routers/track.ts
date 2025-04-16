import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const trackRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        tags: z.array(z.string()),
        bpm: z.number(),
        mood: z.string(),
        fileUrl: z.string(),
        waveformUrl: z.string().optional(),
        price: z.number(),
        isExclusive: z.boolean(),
        usageRights: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "ARTIST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only artists can create tracks",
        });
      }

      const track = await ctx.prisma.track.create({
        data: {
          ...input,
          artistId: ctx.session.user.id,
        },
      });

      return track;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const track = await ctx.prisma.track.findUnique({
        where: { id: input.id },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!track) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Track not found",
        });
      }

      return track;
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
        bpm: z.number().optional(),
        mood: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, search, tags, bpm, mood } = input;

      const tracks = await ctx.prisma.track.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          AND: [
            search
              ? {
                  OR: [
                    { name: { contains: search } },
                    { tags: { hasSome: [search] } },
                  ],
                }
              : {},
            tags ? { tags: { hasSome: tags } } : {},
            bpm ? { bpm } : {},
            mood ? { mood } : {},
          ],
        },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (tracks.length > limit) {
        const nextItem = tracks.pop();
        nextCursor = nextItem!.id;
      }

      return {
        tracks,
        nextCursor,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          tags: z.array(z.string()).optional(),
          bpm: z.number().optional(),
          mood: z.string().optional(),
          price: z.number().optional(),
          isExclusive: z.boolean().optional(),
          usageRights: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const track = await ctx.prisma.track.findUnique({
        where: { id: input.id },
      });

      if (!track) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Track not found",
        });
      }

      if (track.artistId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own tracks",
        });
      }

      const updatedTrack = await ctx.prisma.track.update({
        where: { id: input.id },
        data: input.data,
      });

      return updatedTrack;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const track = await ctx.prisma.track.findUnique({
        where: { id: input.id },
      });

      if (!track) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Track not found",
        });
      }

      if (track.artistId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own tracks",
        });
      }

      await ctx.prisma.track.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});