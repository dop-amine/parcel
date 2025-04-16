import { router } from "../trpc";
import { artistRouter } from "./artist";
import { trackRouter } from "./track";

export const appRouter = router({
  artist: artistRouter,
  track: trackRouter,
});

export type AppRouter = typeof appRouter;