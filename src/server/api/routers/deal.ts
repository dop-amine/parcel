import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { dealService } from "@/server/services/dealService";
import { InvalidStateTransitionError, UnauthorizedActionError } from "@/types/deal";

const dealSchema = z.object({
  trackId: z.string(),
  terms: z.object({
    usageType: z.string(),
    rights: z.array(z.string()),
    duration: z.number(),
    price: z.number(),
  }),
});

export const dealRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const deals = await ctx.db.deal.findMany({
      where: {
        OR: [
          { artistId: ctx.session.user.id },
          { execId: ctx.session.user.id },
        ],
      },
      include: {
        track: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return dealService.getDeals(deals);
  }),

  create: protectedProcedure
    .input(dealSchema)
    .mutation(async ({ ctx, input }) => {
      const track = await ctx.db.track.findUnique({
        where: { id: input.trackId },
      });

      if (!track) {
        throw new Error("Track not found");
      }

      const deal = await ctx.db.deal.create({
        data: {
          trackId: input.trackId,
          execId: ctx.session.user.id,
          artistId: track.userId,
          state: "PENDING",
          terms: input.terms,
          createdById: ctx.session.user.id,
          createdByRole: ctx.session.user.role,
        },
        include: {
          track: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      });

      return dealService.mapToDeal(deal);
    }),

  getDeal: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input }) => {
      return await dealService.getDeal(input.dealId);
    }),

  updateDealState: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        newState: z.enum(["PENDING", "COUNTERED", "ACCEPTED", "DECLINED", "AWAITING_RESPONSE", "CANCELLED"]),
        changes: z.object({
          usageType: z.enum(["SYNC", "MASTER"]).optional(),
          rights: z.enum(["EXCLUSIVE", "NON_EXCLUSIVE"]).optional(),
          duration: z.number().optional(),
          price: z.number().optional(),
        }).optional().default({}),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // First check if the user is part of this deal
      const deal = await ctx.db.deal.findUnique({
        where: { id: input.dealId },
      });

      if (!deal) {
        throw new Error("Deal not found");
      }

      console.log("Deal:", {
        artistId: deal.artistId,
        execId: deal.execId,
        userId: ctx.session.user.id,
        userRole: ctx.session.user.role,
        currentState: deal.state,
        newState: input.newState
      });

      if (deal.artistId !== ctx.session.user.id && deal.execId !== ctx.session.user.id) {
        console.log("Unauthorized: User is not part of this deal");
        throw new UnauthorizedActionError();
      }

      try {
        return await dealService.updateDealState(
          input.dealId,
          ctx.session.user.id,
          ctx.session.user.role,
          input.newState,
          input.changes
        );
      } catch (error) {
        if (error instanceof InvalidStateTransitionError) {
          throw new Error("Invalid state transition");
        }
        if (error instanceof UnauthorizedActionError) {
          throw new Error("Unauthorized action");
        }
        throw error;
      }
    }),
});