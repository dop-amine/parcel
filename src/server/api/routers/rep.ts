import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "@/server/db";
import { TRPCError } from "@trpc/server";
// import { sendEmail } from "@/lib/email"; // TODO: Implement email service

export const repRouter = createTRPCRouter({
  // ===== PLAYLIST SHARING =====

  // Share playlist with external exec
  sharePlaylist: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        email: z.string().email(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is REP and owns playlist
      if (ctx.session.user.role !== "REP") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only REPs can share playlists" });
      }

      const playlist = await prisma.playlist.findFirst({
        where: { id: input.playlistId, userId: ctx.session.user.id },
        include: { tracks: { include: { track: true } } },
      });

      if (!playlist) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" });
      }

      // Create playlist share with unique token
      const share = await prisma.playlistShare.create({
        data: {
          playlistId: input.playlistId,
          email: input.email,
          repId: ctx.session.user.id,
          status: "PENDING",
        },
        include: {
          playlist: {
            include: {
              tracks: { include: { track: { include: { user: true } } } },
            },
          },
          rep: true,
        },
      });

      // TODO: Send email notification
      try {
        const shareUrl = `${process.env.NEXTAUTH_URL}/shared/${share.shareToken}`;
        // await sendEmail({
        //   to: input.email,
        //   subject: `${ctx.session.user.name} shared a playlist with you`,
        //   template: 'playlist-share',
        //   data: {
        //     playlistName: playlist.name,
        //     repName: ctx.session.user.name,
        //     message: input.message,
        //     shareUrl,
        //     trackCount: playlist.tracks.length
        //   }
        // });
        console.log(`Would send email to ${input.email} with share URL: ${shareUrl}`);
      } catch (error) {
        console.error("Failed to send email:", error);
        // Don't fail the request if email fails
      }

      return share;
    }),

  // Get playlist shares for REP
  getPlaylistShares: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "REP") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only REPs can view shares" });
    }

    return prisma.playlistShare.findMany({
      where: { repId: ctx.session.user.id },
      include: {
        playlist: true,
        deal: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ===== CONTACT MANAGEMENT =====

  // Add executive contact
  addExecContact: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        company: z.string().optional(),
        title: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "REP") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only REPs can add contacts" });
      }

      return prisma.execContact.create({
        data: {
          ...input,
          repId: ctx.session.user.id,
        },
      });
    }),

  // Get all contacts for REP
  getExecContacts: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "REP") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only REPs can view contacts" });
    }

    return prisma.execContact.findMany({
      where: { repId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Update executive contact
  updateExecContact: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        notes: z.string().optional(),
        lastContactedAt: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "REP") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only REPs can update contacts" });
      }

      const { contactId, ...updateData } = input;

      return prisma.execContact.update({
        where: {
          id: contactId,
          repId: ctx.session.user.id, // Ensure REP owns this contact
        },
        data: updateData,
      });
    }),

  // Delete executive contact
  deleteExecContact: protectedProcedure
    .input(z.object({ contactId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "REP") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only REPs can delete contacts" });
      }

      await prisma.execContact.delete({
        where: {
          id: input.contactId,
          repId: ctx.session.user.id, // Ensure REP owns this contact
        },
      });

      return { success: true };
    }),

  // ===== ACTIVITY & MESSAGES =====

  // Get REP activity feed (deals, shares, contacts)
  getRepActivity: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "REP") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only REPs can view activity" });
    }

    // Get deals initiated by this REP
    const deals = await prisma.deal.findMany({
      where: { repId: ctx.session.user.id },
      include: {
        track: { include: { user: true } },
        artist: true,
        exec: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get playlist shares by this REP
    const shares = await prisma.playlistShare.findMany({
      where: { repId: ctx.session.user.id },
      include: {
        playlist: true,
        deal: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Combine and sort by date
    const activities = [
      ...deals.map((deal) => ({
        id: deal.id,
        type: "deal" as const,
        subType: deal.state.toLowerCase(),
        title: `Deal ${deal.state.toLowerCase()}`,
        content: `Deal for "${deal.track.title}" is ${deal.state.toLowerCase()}`,
        createdAt: deal.createdAt,
        metadata: {
          trackTitle: deal.track.title,
          artistName: deal.artist.name,
          execEmail: deal.execEmail || deal.exec?.email,
          execName: deal.exec?.name,
          amount: deal.terms && typeof deal.terms === 'object' && 'price' in deal.terms ? (deal.terms as any).price : null,
          status: deal.state,
        },
      })),
      ...shares.map((share) => ({
        id: share.id,
        type: "share" as const,
        subType: share.status.toLowerCase(),
        title: `Playlist ${share.status.toLowerCase()}`,
        content: `Playlist "${share.playlist.name}" was ${share.status.toLowerCase()} by ${share.email}`,
        createdAt: share.createdAt,
        metadata: {
          playlistName: share.playlist.name,
          execEmail: share.email,
          status: share.status,
          viewedAt: share.viewedAt,
        },
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return activities;
  }),

  // Get REP dashboard stats
  getRepStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "REP") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only REPs can view stats" });
    }

    const [dealCount, shareCount, contactCount, conversionData] = await Promise.all([
      // Active deals initiated by REP
      prisma.deal.count({
        where: {
          repId: ctx.session.user.id,
          state: { in: ["PENDING", "COUNTERED", "AWAITING_RESPONSE"] },
        },
      }),
      // Playlists shared by REP
      prisma.playlistShare.count({
        where: { repId: ctx.session.user.id },
      }),
      // Executive contacts
      prisma.execContact.count({
        where: { repId: ctx.session.user.id },
      }),
      // Conversion data (shares → deals)
      prisma.$transaction([
        prisma.playlistShare.count({
          where: { repId: ctx.session.user.id },
        }),
        prisma.deal.count({
          where: {
            repId: ctx.session.user.id,
            state: "ACCEPTED",
          },
        }),
      ]),
    ]);

    const [totalShares, acceptedDeals] = conversionData;
    const conversionRate = totalShares > 0 ? (acceptedDeals / totalShares) * 100 : 0;

    return {
      activeDeals: dealCount,
      sharedPlaylists: shareCount,
      execContacts: contactCount,
      conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
    };
  }),

  // ===== PLAYLISTS FOR REP =====

  // Get playlists for REP (reuse existing but filter by REP role)
  getRepPlaylists: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "REP") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only REPs can view playlists" });
    }

    return prisma.playlist.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        tracks: {
          include: { track: { include: { user: true } } },
          orderBy: { order: "asc" },
        },
        shares: {
          where: { repId: ctx.session.user.id }, // Only shares created by this REP
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            tracks: true,
            shares: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});

// ===== PUBLIC ENDPOINTS FOR SHARED PLAYLISTS =====

export const publicSharedRouter = createTRPCRouter({
  // Get shared playlist by token (public access)
  getSharedPlaylist: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const share = await prisma.playlistShare.findUnique({
        where: { shareToken: input.token },
        include: {
          playlist: {
            include: {
              tracks: {
                include: { track: { include: { user: true } } },
                orderBy: { order: "asc" },
              },
              user: true,
            },
          },
          rep: true,
        },
      });

      if (!share) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shared playlist not found" });
      }

      // Update view tracking
      await prisma.playlistShare.update({
        where: { id: share.id },
        data: {
          viewedAt: new Date(),
          status: share.status === "PENDING" ? "VIEWED" : share.status,
        },
      });

      return share;
    }),

  // Submit deal offer from shared playlist (external exec without account)
  submitExternalDealOffer: publicProcedure
    .input(
      z.object({
        shareToken: z.string(),
        trackId: z.string(),
        execName: z.string(),
        execEmail: z.string().email(),
        company: z.string().optional(),
        usageType: z.enum(["SYNC", "MASTER"]),
        rights: z.enum(["EXCLUSIVE", "NON_EXCLUSIVE"]),
        duration: z.number().min(1).max(60), // months
        price: z.number().min(100), // minimum $100
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Find the share
      const share = await prisma.playlistShare.findUnique({
        where: { shareToken: input.shareToken },
        include: {
          playlist: true,
          rep: true,
        },
      });

      if (!share) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shared playlist not found" });
      }

      // Find the track and its artist
      const track = await prisma.track.findUnique({
        where: { id: input.trackId },
        include: { user: true },
      });

      if (!track) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
      }

      // Create deal with external exec info
      const deal = await prisma.deal.create({
        data: {
          state: "PENDING",
          terms: {
            usageType: input.usageType,
            rights: input.rights,
            duration: input.duration,
            price: input.price,
            message: input.message,
          },
          createdById: share.repId!, // REP who shared the playlist
          createdByRole: "REP",
          trackId: input.trackId,
          artistId: track.userId,
          execEmail: input.execEmail, // External exec without account
          repId: share.repId,
          playlistShares: {
            connect: { id: share.id },
          },
        },
        include: {
          track: { include: { user: true } },
          artist: true,
          rep: true,
        },
      });

      // Update share status
      await prisma.playlistShare.update({
        where: { id: share.id },
        data: { status: "DEAL_CREATED" },
      });

      // Add exec to contacts if not already exists
      if (share.repId) {
        await prisma.execContact.upsert({
          where: { email: input.execEmail },
          update: {
            name: input.execName,
            company: input.company,
            lastContactedAt: new Date(),
          },
          create: {
            email: input.execEmail,
            name: input.execName,
            company: input.company,
            repId: share.repId,
            lastContactedAt: new Date(),
            notes: `Added via playlist share: ${share.playlist.name}`,
          },
        });
      }

      // TODO: Send notifications to artist and REP
      console.log(`Deal created: ${deal.id} for track ${track.title} by external exec ${input.execEmail}`);

      return deal;
    }),
});