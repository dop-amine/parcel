import { z } from "zod";
import { hash } from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "../trpc";
import prisma from "@/lib/prisma";
import { TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';

export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        role: z.enum(["ARTIST", "EXEC"]),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password, name, role } = input;

      const exists = await prisma.user.findUnique({
        where: { email },
      });

      if (exists) {
        throw new Error("User already exists");
      }

      const hashedPassword = await hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword,
          type: role,
        },
      });

      return { success: true, user };
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
});