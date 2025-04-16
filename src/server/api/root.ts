import { createTRPCRouter } from "./trpc";
import { userRouter } from "./routers/user";
import { artistRouter } from "./routers/artist";
import { trackRouter } from "./routers/track";

export const appRouter = createTRPCRouter({
  user: userRouter,
  artist: artistRouter,
  track: trackRouter,
});

export type AppRouter = typeof appRouter;