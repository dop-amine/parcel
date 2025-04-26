import { createTRPCRouter } from "./trpc";
import { userRouter } from "./routers/user";
import { artistRouter } from "./routers/artist";
import { trackRouter } from "./routers/track";
import { uploadRouter } from "./routers/upload";
import { dealRouter } from "./routers/deal";
import { chatRouter } from "./routers/chat";
import { likeRouter } from "./routers/like";
import { playlistRouter } from "./routers/playlist";

export const appRouter = createTRPCRouter({
  user: userRouter,
  artist: artistRouter,
  track: trackRouter,
  upload: uploadRouter,
  deal: dealRouter,
  chat: chatRouter,
  like: likeRouter,
  playlist: playlistRouter,
});

export type AppRouter = typeof appRouter;