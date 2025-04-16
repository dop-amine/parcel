import { z } from "zod";
import { hash } from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "../trpc";
import prisma from "@/lib/prisma";

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
          password: hashedPassword,
          role,
        },
      });

      return { success: true, user };
    }),
});