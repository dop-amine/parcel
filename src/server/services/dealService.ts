import { prisma } from "@/server/db";
import {
  Deal,
  DealStatus,
  DealTerms,
  DealHistoryEntry,
  DEAL_STATE_TRANSITIONS,
  InvalidStateTransitionError,
  UnauthorizedActionError
} from "@/types/deal";
import { Prisma } from "@prisma/client";
import { WebSocketServer } from 'ws';
import { broadcastDealUpdate } from '@/server/websocket';

declare global {
  var wss: WebSocketServer | undefined;
}

export class DealService {
  async getDeal(dealId: string): Promise<Deal> {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        track: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!deal) {
      throw new Error("Deal not found");
    }

    return this.mapToDeal(deal);
  }

  async getDeals(deals: any[]): Promise<Deal[]> {
    return deals.map(deal => this.mapToDeal(deal));
  }

  async updateDealState(
    dealId: string,
    userId: string,
    userRole: string,
    newState: DealStatus,
    changes?: Partial<DealTerms>
  ): Promise<Deal> {
    const deal = await this.getDeal(dealId);

    // Validate state transition
    this.validateStateTransition(deal.state, newState, userRole as any);

    // Create history entry
    await prisma.dealHistory.create({
      data: {
        dealId: deal.id,
        userId,
        userRole,
        action: this.getActionFromStateChange(deal.state, newState),
        previousState: deal.state,
        newState,
        changes: changes as unknown as Prisma.JsonObject ?? {},
      }
    });

    // Update deal
    const currentTerms = deal.terms;
    const newTerms = changes
      ? { ...currentTerms, ...changes }
      : currentTerms;

    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        state: newState,
        terms: newTerms as unknown as Prisma.JsonObject,
        updatedAt: new Date()
      },
      include: {
        track: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Broadcast the update to relevant users
    if (global.wss) {
      broadcastDealUpdate(global.wss, this.mapToDeal(updatedDeal));
    }

    return this.mapToDeal(updatedDeal);
  }

  private validateStateTransition(
    currentState: DealStatus,
    newState: DealStatus,
    userRole: string
  ): void {
    const transition = DEAL_STATE_TRANSITIONS.find(
      t => t.from === currentState && t.to === newState
    );

    if (!transition) {
      throw new InvalidStateTransitionError();
    }

    // Check if user's role is in the allowed roles for this transition
    const allowedRoles = transition.allowedRoles;
    if (!allowedRoles.includes(userRole as "ARTIST" | "EXEC")) {
      throw new UnauthorizedActionError();
    }
  }

  private getActionFromStateChange(
    previousState: DealStatus,
    newState: DealStatus
  ): "COUNTER" | "ACCEPT" | "DECLINE" | "CANCEL" {
    if (newState === "COUNTERED") return "COUNTER";
    if (newState === "ACCEPTED") return "ACCEPT";
    if (newState === "DECLINED") return "DECLINE";
    if (newState === "CANCELLED") return "CANCEL";
    return "COUNTER"; // Default for PENDING state
  }

  mapToDeal(data: any): Deal {
    const terms = data.terms as Prisma.JsonObject;
    return {
      id: data.id,
      state: data.state as DealStatus,
      terms: terms as unknown as DealTerms,
      createdById: data.createdById,
      createdByRole: data.createdByRole,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      trackId: data.trackId,
      track: {
        id: data.track.id,
        title: data.track.title
      },
      artistId: data.artistId,
      execId: data.execId
    };
  }
}

export const dealService = new DealService();