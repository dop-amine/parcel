import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { trackRouter } from "./routers/track";
import { purchaseRouter } from "./routers/purchase";
import { messageRouter } from "./routers/message";

export const appRouter = router({
  auth: authRouter,
  track: trackRouter,
  purchase: purchaseRouter,
  message: messageRouter,
});

export type AppRouter = typeof appRouter;