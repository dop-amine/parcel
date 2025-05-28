import { z } from "zod";
import { hash } from "bcryptjs";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import prisma from "@/lib/prisma";
import { TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import { DEFAULT_ARTIST_TIER, DEFAULT_BUYER_TIER } from '@/utils/tiers';

export const userRouter = createTRPCRouter({
  // Public user creation - only ARTIST and EXEC allowed
  create: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        role: z.enum(["ARTIST", "EXEC"]), // Only allow ARTIST and EXEC for public signup
        tier: z.enum(["ARTIST", "LABEL", "CREATOR", "STUDIO"]).optional(), // Exclude request-access tiers
      })
    )
    .mutation(async ({ input }) => {
      const { email, password, name, role, tier } = input;

      const exists = await prisma.user.findUnique({
        where: { email },
      });

      if (exists) {
        throw new Error("User already exists");
      }

      const hashedPassword = await hash(password, 10);

      // Assign default tier if not provided
      let userTier: string;
      if (tier) {
        userTier = tier;
      } else {
        userTier = role === 'ARTIST' ? DEFAULT_ARTIST_TIER : DEFAULT_BUYER_TIER;
      }

      // Validate tier matches role
      if (role === 'ARTIST' && !['ARTIST', 'LABEL'].includes(userTier)) {
        throw new Error("Invalid tier for artist role");
      }
      if (role === 'EXEC' && !['CREATOR', 'STUDIO'].includes(userTier)) {
        throw new Error("Invalid tier for executive role");
      }

      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword,
          type: role,
          tier: userTier as any, // Cast to match Prisma type
        },
      });

      return { success: true, user };
    }),

  // Admin user creation - allows all roles including REP and ADMIN
  createByAdmin: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        role: z.enum(["ARTIST", "EXEC", "REP", "ADMIN"]),
        tier: z.enum(["ARTIST", "LABEL", "ROSTERED", "CREATOR", "STUDIO", "PRO"]).optional(),
        isActive: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only allow admins to create users
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create users',
        });
      }

      const { email, password, name, role, tier, isActive } = input;

      const exists = await prisma.user.findUnique({
        where: { email },
      });

      if (exists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
        });
      }

      const hashedPassword = await hash(password, 10);

      // Assign default tier if not provided and not admin/rep
      let userTier = tier;
      if (!userTier && role === 'ARTIST') {
        userTier = DEFAULT_ARTIST_TIER;
      } else if (!userTier && role === 'EXEC') {
        userTier = DEFAULT_BUYER_TIER;
      }

      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword,
          type: role,
          tier: userTier,
          isActive,
        },
        select: {
          id: true,
          name: true,
          email: true,
          type: true,
          tier: true,
          isActive: true,
          createdAt: true,
        },
      });

      return { success: true, user };
    }),

  // Update user - only for admins
  updateUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["ARTIST", "EXEC", "REP", "ADMIN"]).optional(),
        tier: z.enum(["ARTIST", "LABEL", "ROSTERED", "CREATOR", "STUDIO", "PRO"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only allow admins to update users
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update users',
        });
      }

      const { userId, ...updateData } = input;

      // Don't allow updating email to an existing one
      if (updateData.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email },
        });
        if (existingUser && existingUser.id !== userId) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already in use',
          });
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          type: true,
          tier: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              tracks: true,
              dealsAsArtist: true,
              dealsAsExec: true,
            },
          },
        },
      });

      return user;
    }),

  // Delete user - only for admins
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Only allow admins to delete users
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete users',
        });
      }

      // Don't allow deleting yourself
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete your own account',
        });
      }

      await prisma.user.delete({
        where: { id: input.userId },
      });

      return { success: true };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
    });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    return user;
  }),

  updateProfile: publicProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      profilePicture: z.string().optional().nullable(),
      bio: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      socialLinks: z.any().optional().nullable(),
      genres: z.array(z.string()).optional(),
      company: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const data: any = { ...input };
      // Only update genres if provided
      if (input.genres !== undefined) {
        data.genres = input.genres;
      }
      const user = await prisma.user.update({
        where: { id: ctx.session.user.id },
        data,
      });
      return user;
    }),

  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    // Only allow admins to get all users
    if (ctx.session.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can access all users',
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        tier: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            tracks: true,
            dealsAsArtist: true,
            dealsAsExec: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }),
});