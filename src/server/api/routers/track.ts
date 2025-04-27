import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { GENRES, MOODS } from "@/constants/music";
import { prisma } from "@/server/db";
import { type Prisma } from "@prisma/client";
import { uploadToBlob } from "@/lib/blob";
import { put } from "@vercel/blob";
import WaveSurfer from "wavesurfer.js";

const genreEnum = z.enum(GENRES.map(g => g.id) as [string, ...string[]]);
const moodEnum = z.enum(MOODS.map(m => m.id) as [string, ...string[]]);

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
      select: {
        id: true,
        title: true,
        description: true,
        audioUrl: true,
        coverUrl: true,
        bpm: true,
        duration: true,
        genres: true,
        moods: true,
        createdAt: true,
      },
    });
  }),

  upload: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        fileUrl: z.string(),
        duration: z.number().min(0),
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
          duration: input.duration,
          genres: [],
          moods: [],
          userId,
        },
      });

      return track;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        audioUrl: z.string().url('Invalid audio URL'),
        coverUrl: z.string().url('Invalid cover URL').optional(),
        bpm: z.number().min(1).max(999).optional(),
        duration: z.number().min(0),
        genres: z.array(genreEnum).min(1, 'At least one genre is required'),
        moods: z.array(moodEnum).optional(),
        basePrice: z.number().min(0).optional(),
        isNegotiable: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('Track creation request received');
      console.log('Session:', ctx.session);

      if (!ctx.session?.user?.id) {
        console.log('No session found');
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to create tracks',
        });
      }

      // Verify user is an artist
      if (ctx.session.user.role !== 'ARTIST') {
        console.log('User is not an artist:', ctx.session.user.role);
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only artists can create tracks',
        });
      }

      const trackData = {
        title: input.title,
        description: input.description,
        audioUrl: input.audioUrl,
        coverUrl: input.coverUrl,
        duration: input.duration,
        genres: input.genres,
        moods: input.moods || [],
        basePrice: input.basePrice,
        isNegotiable: input.isNegotiable,
        userId: ctx.session.user.id,
      };

      if (input.bpm) {
        Object.assign(trackData, { bpm: input.bpm });
      }

      console.log('Creating track with data:', trackData);

      return prisma.track.create({
        data: trackData,
      });
    }),

  // Get all tracks by the current artist
  getMyTracks: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== 'ARTIST') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only artists can view their tracks',
      });
    }

    return prisma.track.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        audioUrl: true,
        coverUrl: true,
        bpm: true,
        duration: true,
        genres: true,
        moods: true,
        createdAt: true,
        _count: {
          select: {
            plays: true,
            purchases: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });
  }),

  // Get track statistics
  getStats: protectedProcedure
    .input(z.object({ trackId: z.string() }))
    .query(async ({ ctx, input }) => {
      const track = await prisma.track.findUnique({
        where: { id: input.trackId },
        include: {
          _count: {
            select: {
              plays: true,
              purchases: true,
            },
          },
          earnings: {
            select: {
              amount: true,
            },
          },
        },
      });

      if (!track) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Track not found',
        });
      }

      if (track.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Unauthorized',
        });
      }

      const totalEarnings = track.earnings.reduce(
        (sum, earning) => sum + earning.amount,
        0
      );

      return {
        plays: track._count.plays,
        purchases: track._count.purchases,
        earnings: totalEarnings,
      };
    }),

  uploadAndCreate: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        genres: z.array(genreEnum).min(1),
        moods: z.array(moodEnum).min(1),
        bpm: z.number().min(1).max(999).optional(),
        audioUrl: z.string().url(),
        duration: z.number().min(0),
        waveformData: z.array(z.number()).optional(),
        basePrice: z.number().min(0).optional(),
        isNegotiable: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;

      if (user.role !== "ARTIST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only artists can upload tracks",
        });
      }

      // Create the track record
      const track = await prisma.track.create({
        data: {
          title: input.title,
          description: input.description,
          genres: input.genres,
          moods: input.moods,
          bpm: input.bpm,
          audioUrl: input.audioUrl,
          duration: input.duration,
          waveformData: input.waveformData,
          basePrice: input.basePrice,
          isNegotiable: input.isNegotiable,
          userId: user.id,
        },
      });

      return track;
    }),

  getAllPublic: publicProcedure
    .input(
      z.object({
        genres: z.array(z.string()).optional(),
        moods: z.array(z.string()).optional(),
        bpmMin: z.number().optional(),
        bpmMax: z.number().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const { genres, moods, bpmMin, bpmMax, page = 1, limit = 10 } = input;

      const tracks = await prisma.track.findMany({
        where: {
          AND: [
            // Genre filter
            genres?.length
              ? {
                  genres: {
                    hasSome: genres,
                  },
                }
              : {},
            // Mood filter
            moods?.length
              ? {
                  moods: {
                    hasSome: moods,
                  },
                }
              : {},
            // BPM range filter
            bpmMin !== undefined
              ? {
                  bpm: {
                    gte: bpmMin,
                  },
                }
              : {},
            bpmMax !== undefined
              ? {
                  bpm: {
                    lte: bpmMax,
                  },
                }
              : {},
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          audioUrl: true,
          coverUrl: true,
          bpm: true,
          duration: true,
          genres: true,
          moods: true,
          createdAt: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await prisma.track.count({
        where: {
          AND: [
            genres?.length
              ? {
                  genres: {
                    hasSome: genres,
                  },
                }
              : {},
            moods?.length
              ? {
                  moods: {
                    hasSome: moods,
                  },
                }
              : {},
            bpmMin !== undefined
              ? {
                  bpm: {
                    gte: bpmMin,
                  },
                }
              : {},
            bpmMax !== undefined
              ? {
                  bpm: {
                    lte: bpmMax,
                  },
                }
              : {},
          ],
        },
      });

      return {
        tracks: tracks.map(track => ({
          ...track,
          artist: track.user
            ? {
                id: track.user.id,
                name: track.user.name,
                profilePicture: track.user.profilePicture,
              }
            : null,
        })),
        total,
        page,
        limit,
      };
    }),

  // Add a new procedure to get waveform data
  getWaveformData: publicProcedure
    .input(z.object({ trackId: z.string() }))
    .query(async ({ input }) => {
      const track = await prisma.track.findUnique({
        where: { id: input.trackId },
        select: {
          waveformData: true,
        },
      });

      if (!track) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Track not found",
        });
      }

      return track.waveformData;
    }),
});