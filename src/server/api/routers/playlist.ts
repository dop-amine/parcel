import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "@/server/db";
import { TRPCError } from "@trpc/server";

export const playlistRouter = createTRPCRouter({
  // Get all playlists for current user
  getPlaylists: protectedProcedure.query(async ({ ctx }) => {
    return prisma.playlist.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        tracks: { include: { track: { include: { user: true } } }, orderBy: { order: "asc" } },
        shares: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Create a new playlist
  createPlaylist: protectedProcedure.input(z.object({
    name: z.string(),
    description: z.string().optional(),
    coverUrl: z.string().url().optional(),
    isPublic: z.boolean().optional(),
  })).mutation(async ({ input, ctx }) => {
    const playlist = await prisma.playlist.create({
      data: {
        name: input.name,
        description: input.description,
        coverUrl: input.coverUrl,
        isPublic: input.isPublic ?? false,
        userId: ctx.session.user.id,
      },
      include: { tracks: true, shares: true },
    });
    return playlist;
  }),

  // Update playlist details
  updatePlaylist: protectedProcedure.input(z.object({
    playlistId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    coverUrl: z.string().url().optional(),
    isPublic: z.boolean().optional(),
  })).mutation(async ({ input, ctx }) => {
    const playlist = await prisma.playlist.update({
      where: { id: input.playlistId, userId: ctx.session.user.id },
      data: {
        name: input.name,
        description: input.description,
        coverUrl: input.coverUrl,
        isPublic: input.isPublic,
      },
      include: { tracks: true, shares: true },
    });
    return playlist;
  }),

  // Delete a playlist
  deletePlaylist: protectedProcedure.input(z.object({ playlistId: z.string() })).mutation(async ({ input, ctx }) => {
    await prisma.playlist.delete({ where: { id: input.playlistId, userId: ctx.session.user.id } });
    return { success: true };
  }),

  // Add a track to a playlist
  addTrackToPlaylist: protectedProcedure.input(z.object({ playlistId: z.string(), trackId: z.string() })).mutation(async ({ input, ctx }) => {
    // Ensure playlist belongs to user
    const playlist = await prisma.playlist.findFirst({ where: { id: input.playlistId, userId: ctx.session.user.id } });
    if (!playlist) throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" });
    // Find max order
    const maxOrder = await prisma.playlistTrack.aggregate({
      where: { playlistId: input.playlistId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? 0) + 1;
    await prisma.playlistTrack.upsert({
      where: { playlistId_trackId: { playlistId: input.playlistId, trackId: input.trackId } },
      update: {},
      create: { playlistId: input.playlistId, trackId: input.trackId, order },
    });
    // Return updated tracks
    return prisma.playlistTrack.findMany({
      where: { playlistId: input.playlistId },
      include: { track: { include: { user: true } } },
      orderBy: { order: "asc" },
    });
  }),

  // Remove a track from a playlist
  removeTrackFromPlaylist: protectedProcedure.input(z.object({ playlistId: z.string(), trackId: z.string() })).mutation(async ({ input, ctx }) => {
    const playlist = await prisma.playlist.findFirst({ where: { id: input.playlistId, userId: ctx.session.user.id } });
    if (!playlist) throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" });
    await prisma.playlistTrack.deleteMany({ where: { playlistId: input.playlistId, trackId: input.trackId } });
    // Return updated tracks
    return prisma.playlistTrack.findMany({
      where: { playlistId: input.playlistId },
      include: { track: { include: { user: true } } },
      orderBy: { order: "asc" },
    });
  }),

  // Reorder tracks in a playlist
  reorderTracks: protectedProcedure.input(z.object({
    playlistId: z.string(),
    order: z.array(z.object({ trackId: z.string(), order: z.number() })),
  })).mutation(async ({ input, ctx }) => {
    const playlist = await prisma.playlist.findFirst({ where: { id: input.playlistId, userId: ctx.session.user.id } });
    if (!playlist) throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" });
    // Update order for each track
    await Promise.all(input.order.map(({ trackId, order }) =>
      prisma.playlistTrack.update({
        where: { playlistId_trackId: { playlistId: input.playlistId, trackId } },
        data: { order },
      })
    ));
    // Return updated tracks
    return prisma.playlistTrack.findMany({
      where: { playlistId: input.playlistId },
      include: { track: { include: { user: true } } },
      orderBy: { order: "asc" },
    });
  }),

  // Get tracks in a playlist
  getPlaylistTracks: protectedProcedure.input(z.object({ playlistId: z.string() })).query(async ({ input, ctx }) => {
    const playlist = await prisma.playlist.findFirst({ where: { id: input.playlistId, userId: ctx.session.user.id } });
    if (!playlist) throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" });
    return prisma.playlistTrack.findMany({
      where: { playlistId: input.playlistId },
      include: { track: { include: { user: true } } },
      orderBy: { order: "asc" },
    });
  }),

  // Share a playlist (creates PlaylistShare records)
  sharePlaylist: protectedProcedure.input(z.object({
    playlistId: z.string(),
    emails: z.array(z.string().email()),
  })).mutation(async ({ input, ctx }) => {
    const playlist = await prisma.playlist.findFirst({ where: { id: input.playlistId, userId: ctx.session.user.id } });
    if (!playlist) throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" });
    // Create shares
    const shares = await Promise.all(input.emails.map(email =>
      prisma.playlistShare.create({
        data: { playlistId: input.playlistId, email },
      })
    ));
    // TODO: Send emails (integration point)
    return shares;
  }),

  // Get a shared playlist (public, by shareId)
  getSharedPlaylist: publicProcedure.input(z.object({ shareId: z.string() })).query(async ({ input }) => {
    const share = await prisma.playlistShare.findUnique({
      where: { id: input.shareId },
      include: {
        playlist: {
          include: {
            tracks: { include: { track: { include: { user: true } } }, orderBy: { order: "asc" } },
            user: true,
          },
        },
      },
    });
    if (!share) throw new TRPCError({ code: "NOT_FOUND", message: "Share not found" });
    return share;
  }),

  // Track share view (update viewedAt/status)
  trackShareView: publicProcedure.input(z.object({ shareId: z.string() })).mutation(async ({ input }) => {
    const share = await prisma.playlistShare.update({
      where: { id: input.shareId },
      data: { viewedAt: new Date(), status: "VIEWED" },
    });
    return share;
  }),

  // Purchase a track from a shared playlist (initiates deal, links to share/email)
  purchaseTrackFromShare: protectedProcedure.input(z.object({
    shareId: z.string(),
    trackId: z.string(),
    execId: z.string(), // exec user id
    price: z.number(),
  })).mutation(async ({ input, ctx }) => {
    // Find share
    const share = await prisma.playlistShare.findUnique({ where: { id: input.shareId } });
    if (!share) throw new TRPCError({ code: "NOT_FOUND", message: "Share not found" });
    // Create deal
    const deal = await prisma.deal.create({
      data: {
        state: "PENDING",
        terms: {},
        createdById: ctx.session.user.id,
        createdByRole: ctx.session.user.role,
        trackId: input.trackId,
        artistId: (await prisma.track.findUnique({ where: { id: input.trackId } }))?.userId!,
        execId: input.execId,
        playlistShares: { connect: { id: input.shareId } },
      },
    });
    // Update share
    await prisma.playlistShare.update({ where: { id: input.shareId }, data: { dealId: deal.id, status: "DEAL_CREATED" } });
    // TODO: Notify admin/sync rep
    return deal;
  }),
});