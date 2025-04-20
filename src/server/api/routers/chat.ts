import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

const messageInclude = {
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} satisfies Prisma.ChatMessageInclude;

export const chatRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const messages = await ctx.db.chatMessage.findMany({
          where: {
            dealId: input.dealId,
          },
          include: messageInclude,
          orderBy: {
            createdAt: "asc",
          },
        });
        return messages;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
        });
      }
    }),

  send: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const deal = await ctx.db.deal.findUnique({
          where: { id: input.dealId },
        });

        if (!deal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Deal not found",
          });
        }

        // Check if user is part of this deal
        if (deal.artistId !== ctx.session.user.id && deal.execId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized to send messages in this deal",
          });
        }

        const message = await ctx.db.chatMessage.create({
          data: {
            dealId: input.dealId,
            userId: ctx.session.user.id,
            content: input.content,
          },
          include: messageInclude,
        });

        // Update deal's updatedAt timestamp
        await ctx.db.deal.update({
          where: { id: input.dealId },
          data: { updatedAt: new Date() },
        });

        return message;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }
    }),
});