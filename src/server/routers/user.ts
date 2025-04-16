import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const userRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return `Hello ${input.name}`;
    }),
});