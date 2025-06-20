import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { GENRES, MOODS, getMediaTypeCategory } from "@/constants/music";
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
        // Basic Song Info
        isrcCode: true,
        iswcCode: true,
        // Ownership & Rights
        ownsFullRights: true,
        masterOwners: true,
        publishingOwners: true,
        songwriters: true,
        // Sync Licensing Preferences
        minimumSyncFee: true,
        allowedMediaTypes: true,
        licenseType: true,
        canBeModified: true,
        disallowedUses: true,
        // Revenue & Payment Info
        royaltyCollectionEntity: true,
        splitConfirmation: true,
        basePrice: true,
        isNegotiable: true,
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
        trackPricing: {
          select: {
            id: true,
            mediaTypeId: true,
            mediaTypeCategory: true,
            basePrice: true,
            buyoutPrice: true,
            hasInstantBuy: true,
            lowestPrice: true,
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
        isrcCode: z.string().optional(),
        iswcCode: z.string().optional(),
        audioUrl: z.string().url(),
        duration: z.number().min(0),
        waveformData: z.array(z.number()).optional(),
        ownsFullRights: z.boolean().default(true),
        masterOwners: z.array(z.object({
          name: z.string(),
          email: z.string().email(),
          percentage: z.number().min(0).max(100),
        })).default([]),
        publishingOwners: z.array(z.object({
          name: z.string(),
          email: z.string().email(),
          percentage: z.number().min(0).max(100),
        })).default([]),
        songwriters: z.array(z.object({
          name: z.string(),
          email: z.string().email(),
          role: z.string(),
        })).default([]),
        minimumSyncFee: z.number().min(0).optional(),
        allowedMediaTypes: z.array(z.string()).default([]),
        licenseType: z.string().default('non-exclusive'),
        canBeModified: z.boolean().default(false),
        disallowedUses: z.string().optional(),
        mediaTypePricing: z.array(z.object({
          mediaTypeId: z.string(),
          basePrice: z.number().optional(),
          buyoutPrice: z.number().optional(),
        })).default([]),
        royaltyCollectionEntity: z.string().optional(),
        splitConfirmation: z.boolean().default(false),
        basePrice: z.number().min(0).optional(),
        isNegotiable: z.boolean().default(false),
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

      // Use transaction to create track and pricing records together
      const result = await prisma.$transaction(async (tx) => {
        // Create the track record first
        const track = await tx.track.create({
          data: {
            title: input.title,
            description: input.description,
            genres: input.genres,
            moods: input.moods,
            bpm: input.bpm,
            isrcCode: input.isrcCode,
            iswcCode: input.iswcCode,
            audioUrl: input.audioUrl,
            duration: input.duration,
            waveformData: input.waveformData,
            ownsFullRights: input.ownsFullRights,
            masterOwners: input.masterOwners,
            publishingOwners: input.publishingOwners,
            songwriters: input.songwriters,
            minimumSyncFee: input.minimumSyncFee,
            allowedMediaTypes: input.allowedMediaTypes,
            licenseType: input.licenseType,
            canBeModified: input.canBeModified,
            disallowedUses: input.disallowedUses,
            royaltyCollectionEntity: input.royaltyCollectionEntity,
            splitConfirmation: input.splitConfirmation,
            basePrice: input.basePrice,
            isNegotiable: input.isNegotiable,
            userId: user.id,
          },
        });

        // Create pricing records for each media type
        if (input.mediaTypePricing && input.mediaTypePricing.length > 0) {
          const pricingData = input.mediaTypePricing.map((pricing) => {
            const category = getMediaTypeCategory(pricing.mediaTypeId);
            const lowestPrice = pricing.buyoutPrice
              ? Math.min(pricing.basePrice || 0, pricing.buyoutPrice)
              : (pricing.basePrice || 0);

            return {
              trackId: track.id,
              mediaTypeId: pricing.mediaTypeId,
              mediaTypeCategory: category,
              basePrice: pricing.basePrice || 0,
              buyoutPrice: pricing.buyoutPrice || null,
              hasInstantBuy: Boolean(pricing.buyoutPrice && pricing.buyoutPrice > 0),
              lowestPrice: lowestPrice,
            };
          });

          await tx.trackPricing.createMany({
            data: pricingData,
          });
        }

        // Return track with pricing data
        return await tx.track.findUnique({
          where: { id: track.id },
          include: {
            trackPricing: true,
          },
        });
      });

      return result;
    }),

  // Fetch public tracks with tier-based filtering for buyers
  getAllPublic: publicProcedure
    .input(
      z.object({
        genres: z.array(z.string()).optional(),
        moods: z.array(z.string()).optional(),
        bpmMin: z.number().optional(),
        bpmMax: z.number().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
        // New pricing filters
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        hasInstantBuy: z.boolean().optional(),
        mediaTypes: z.array(z.string()).optional(),
        /**
         * For PRO buyers we allow a toggle to show the entire catalogue (Artist & Label) rather than
         * just the default Rostered tier. The flag has no effect for other roles.
         */
        showAll: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { genres, moods, bpmMin, bpmMax, page = 1, limit = 10, showAll = false, priceMin, priceMax, hasInstantBuy, mediaTypes } = input;

      // Build dynamic filters
      const andFilters: Prisma.TrackWhereInput[] = [];

      // 1. Tier-based visibility for EXEC (buyer) role
      if (ctx.session?.user?.role === 'EXEC') {
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports
        const { getVisibleArtistTiers } = await import('@/utils/tiers');
        const buyerTier = ctx.session.user.tier as import('@/types/deal').BuyerTier | undefined;

        if (buyerTier) {
          // Determine which artist tiers the buyer can see
          let visibleArtistTiers: import('@/types/deal').ArtistTier[];

          if (buyerTier === 'PRO') {
            visibleArtistTiers = showAll
              ? ['ARTIST', 'LABEL', 'ROSTERED']
              : ['ROSTERED'];
          } else {
            visibleArtistTiers = getVisibleArtistTiers(buyerTier);
          }

          andFilters.push({
            user: {
              tier: {
                in: visibleArtistTiers,
              },
            },
          });
        }
      }

      // 2. Genre / mood / BPM filters
      if (genres?.length) {
        andFilters.push({
          genres: {
            hasSome: genres,
          },
        });
      }

      if (moods?.length) {
        andFilters.push({
          moods: {
            hasSome: moods,
          },
        });
      }

      if (bpmMin !== undefined) {
        andFilters.push({
          bpm: {
            gte: bpmMin,
          },
        });
      }

      if (bpmMax !== undefined) {
        andFilters.push({
          bpm: {
            lte: bpmMax,
          },
        });
      }

      // 3. Pricing filters
      if (priceMin !== undefined || priceMax !== undefined || hasInstantBuy !== undefined || mediaTypes?.length) {
        const pricingFilters: any = {};

        if (priceMin !== undefined) {
          pricingFilters.lowestPrice = { gte: priceMin };
        }

        if (priceMax !== undefined) {
          pricingFilters.lowestPrice = { ...pricingFilters.lowestPrice, lte: priceMax };
        }

        if (hasInstantBuy !== undefined) {
          pricingFilters.hasInstantBuy = hasInstantBuy;
        }

        if (mediaTypes?.length) {
          pricingFilters.mediaTypeId = { in: mediaTypes };
        }

        andFilters.push({
          trackPricing: {
            some: pricingFilters,
          },
        });
      }

      const whereClause: Prisma.TrackWhereInput = andFilters.length > 0 ? { AND: andFilters } : {};

      const tracks = await prisma.track.findMany({
        where: whereClause,
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
              tier: true,
            },
          },
          trackPricing: {
            select: {
              id: true,
              mediaTypeId: true,
              mediaTypeCategory: true,
              basePrice: true,
              buyoutPrice: true,
              hasInstantBuy: true,
              lowestPrice: true,
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
        where: whereClause,
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        basePrice: z.number().min(0).optional(),
        isNegotiable: z.boolean().optional(),
        genres: z.array(genreEnum).optional(),
        moods: z.array(moodEnum).optional(),
        bpm: z.number().min(1).max(999).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const track = await prisma.track.findUnique({
        where: { id },
      });

      if (!track) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Track not found",
        });
      }

      // Allow track owner or admin to update
      if (track.userId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own tracks",
        });
      }

      const updatedTrack = await prisma.track.update({
        where: { id },
        data: updateData,
      });

      return updatedTrack;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const track = await prisma.track.findUnique({
        where: { id: input.id },
      });

      if (!track) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Track not found",
        });
      }

      if (track.userId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own tracks",
        });
      }

      // Perform cascading delete - remove all related records first
      await prisma.$transaction(async (tx) => {
        // Delete track pricing records
        await tx.trackPricing.deleteMany({
          where: { trackId: input.id },
        });

        // Delete likes for this track
        await tx.like.deleteMany({
          where: { trackId: input.id },
        });

        // Delete playlist tracks (remove from all playlists)
        await tx.playlistTrack.deleteMany({
          where: { trackId: input.id },
        });

        // Delete plays for this track
        await tx.play.deleteMany({
          where: { trackId: input.id },
        });

        // Delete purchases for this track
        await tx.purchase.deleteMany({
          where: { trackId: input.id },
        });

        // Delete earnings related to this track
        await tx.earning.deleteMany({
          where: { trackId: input.id },
        });

        // Delete any deals related to this track
        await tx.deal.deleteMany({
          where: { trackId: input.id },
        });

        // Finally, delete the track itself
        await tx.track.delete({
          where: { id: input.id },
        });
      });

      return { success: true };
    }),
});