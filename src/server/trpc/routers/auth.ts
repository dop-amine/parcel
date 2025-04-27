import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["ARTIST", "EXEC"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { name, email, password, role } = input;

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email already in use",
        });
      }

      const hashedPassword = await hash(password, 10);

      const user = await ctx.prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          type: role,
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.type,
      };
    }),

  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
});