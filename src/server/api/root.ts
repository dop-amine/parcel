import { createTRPCRouter } from "./trpc";
import { userRouter } from "./routers/user";
import { artistRouter } from "./routers/artist";
import { trackRouter } from "./routers/track";
import { uploadRouter } from "./routers/upload";

export const appRouter = createTRPCRouter({
  user: userRouter,
  artist: artistRouter,
  track: trackRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;