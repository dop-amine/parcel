import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { type Session } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@/server/db";

type CreateContextOptions = {
  session: Session | null;
};

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db: prisma,
  };
};

export const createTRPCContext = async () => {
  const session = await getServerSession(authOptions);
  return createInnerTRPCContext({
    session,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
      cause: "No valid session found",
    });
  }
  return next({
    ctx: {
      session: ctx.session,
      db: ctx.db,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);