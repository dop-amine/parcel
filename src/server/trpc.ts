import { initTRPC, TRPCError } from '@trpc/server';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { type Session } from 'next-auth';
import { type PrismaClient } from '@prisma/client';

export type Context = {
  prisma: PrismaClient;
  session: Session | null;
  headers: Headers;
};

export type CreateContextOptions = {
  headers: Headers;
  session: Session | null;
};

export async function createContextInner(opts: CreateContextOptions) {
  return {
    headers: opts.headers,
    session: opts.session,
    prisma,
  };
}

export const createContext = async (opts: { req: NextRequest }) => {
  const session = await getServerSession(authOptions);

  const contextInner = await createContextInner({
    headers: opts.req.headers,
    session,
  });

  return contextInner;
};

const t = initTRPC.context<typeof createContext>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);