import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const messageRouter = router({
  createThread: protectedProcedure
    .input(
      z.object({
        trackId: z.string(),
        execId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { trackId, execId } = input;

      const track = await ctx.prisma.track.findUnique({
        where: { id: trackId },
      });

      if (!track) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Track not found",
        });
      }

      // Only the artist who owns the track can create a thread
      if (track.artistId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only create threads for your own tracks",
        });
      }

      const thread = await ctx.prisma.messageThread.create({
        data: {
          artistId: ctx.session.user.id,
          execId,
          trackId,
        },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          exec: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          track: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return thread;
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { threadId, content } = input;

      const thread = await ctx.prisma.messageThread.findUnique({
        where: { id: threadId },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      // Only the artist or exec in the thread can send messages
      if (
        thread.artistId !== ctx.session.user.id &&
        thread.execId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only send messages in your own threads",
        });
      }

      const message = await ctx.prisma.message.create({
        data: {
          threadId,
          senderId: ctx.session.user.id,
          content,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return message;
    }),

  listThreads: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor } = input;

      const threads = await ctx.prisma.messageThread.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          OR: [
            { artistId: ctx.session.user.id },
            { execId: ctx.session.user.id },
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
          exec: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          track: {
            select: {
              id: true,
              name: true,
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (threads.length > limit) {
        const nextItem = threads.pop();
        nextCursor = nextItem!.id;
      }

      return {
        threads,
        nextCursor,
      };
    }),

  getThread: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { threadId, limit, cursor } = input;

      const thread = await ctx.prisma.messageThread.findUnique({
        where: { id: threadId },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          exec: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          track: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      // Only the artist or exec in the thread can view it
      if (
        thread.artistId !== ctx.session.user.id &&
        thread.execId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own threads",
        });
      }

      const messages = await ctx.prisma.message.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          threadId,
        },
        include: {
          sender: {
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
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem!.id;
      }

      return {
        thread,
        messages: messages.reverse(),
        nextCursor,
      };
    }),
});