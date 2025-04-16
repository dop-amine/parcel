import { getServerSession } from "next-auth";
import { prisma } from "@/server/db";
import { authOptions } from "@/server/auth";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getServerSession(authOptions);

  return {
    prisma,
    session,
    ...opts,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;