import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "@/server/db";

export const playlistRouter = createTRPCRouter({
  getPlaylists: protectedProcedure.query(async ({ ctx }) => {
    return prisma.playlist.findMany({
      where: { userId: ctx.session.user.id },
      include: { tracks: { include: { track: { include: { user: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }),
  createPlaylist: protectedProcedure.input(z.object({ name: z.string() })).mutation(async ({ input, ctx }) => {
    return prisma.playlist.create({ data: { name: input.name, userId: ctx.session.user.id } });
  }),
  deletePlaylist: protectedProcedure.input(z.object({ playlistId: z.string() })).mutation(async ({ input, ctx }) => {
    return prisma.playlist.delete({ where: { id: input.playlistId, userId: ctx.session.user.id } });
  }),
  addTrackToPlaylist: protectedProcedure.input(z.object({ playlistId: z.string(), trackId: z.string() })).mutation(async ({ input, ctx }) => {
    // Ensure playlist belongs to user
    const playlist = await prisma.playlist.findFirst({ where: { id: input.playlistId, userId: ctx.session.user.id } });
    if (!playlist) throw new Error("Playlist not found");
    return prisma.playlistTrack.upsert({
      where: { playlistId_trackId: { playlistId: input.playlistId, trackId: input.trackId } },
      update: {},
      create: { playlistId: input.playlistId, trackId: input.trackId },
    });
  }),
  removeTrackFromPlaylist: protectedProcedure.input(z.object({ playlistId: z.string(), trackId: z.string() })).mutation(async ({ input, ctx }) => {
    // Ensure playlist belongs to user
    const playlist = await prisma.playlist.findFirst({ where: { id: input.playlistId, userId: ctx.session.user.id } });
    if (!playlist) throw new Error("Playlist not found");
    return prisma.playlistTrack.deleteMany({ where: { playlistId: input.playlistId, trackId: input.trackId } });
  }),
  getPlaylistTracks: protectedProcedure.input(z.object({ playlistId: z.string() })).query(async ({ input, ctx }) => {
    // Ensure playlist belongs to user
    const playlist = await prisma.playlist.findFirst({ where: { id: input.playlistId, userId: ctx.session.user.id } });
    if (!playlist) throw new Error("Playlist not found");
    return prisma.playlistTrack.findMany({
      where: { playlistId: input.playlistId },
      include: { track: { include: { user: true } } },
      orderBy: { addedAt: "desc" },
    });
  }),
});