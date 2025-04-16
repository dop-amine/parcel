import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const purchaseRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        trackId: z.string(),
        price: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "EXEC") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only music executives can purchase tracks",
        });
      }

      const track = await ctx.prisma.track.findUnique({
        where: { id: input.trackId },
      });

      if (!track) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Track not found",
        });
      }

      const purchase = await ctx.prisma.purchase.create({
        data: {
          trackId: input.trackId,
          execId: ctx.session.user.id,
          price: input.price,
        },
        include: {
          track: {
            include: {
              artist: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return purchase;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const purchase = await ctx.prisma.purchase.findUnique({
        where: { id: input.id },
        include: {
          track: {
            include: {
              artist: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          contract: true,
        },
      });

      if (!purchase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Purchase not found",
        });
      }

      // Only the exec who made the purchase or the artist who owns the track can view it
      if (
        purchase.execId !== ctx.session.user.id &&
        purchase.track.artistId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this purchase",
        });
      }

      return purchase;
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor } = input;

      const purchases = await ctx.prisma.purchase.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          OR: [
            { execId: ctx.session.user.id },
            {
              track: {
                artistId: ctx.session.user.id,
              },
            },
          ],
        },
        include: {
          track: {
            include: {
              artist: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          contract: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (purchases.length > limit) {
        const nextItem = purchases.pop();
        nextCursor = nextItem!.id;
      }

      return {
        purchases,
        nextCursor,
      };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const purchase = await ctx.prisma.purchase.findUnique({
        where: { id: input.id },
        include: {
          track: true,
        },
      });

      if (!purchase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Purchase not found",
        });
      }

      // Only the exec who made the purchase or the artist who owns the track can update it
      if (
        purchase.execId !== ctx.session.user.id &&
        purchase.track.artistId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this purchase",
        });
      }

      const updatedPurchase = await ctx.prisma.purchase.update({
        where: { id: input.id },
        data: {
          status: input.status,
        },
      });

      return updatedPurchase;
    }),
});