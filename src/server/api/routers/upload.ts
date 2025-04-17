import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { uploadToBlob } from '@/lib/blob';

export const uploadRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        file: z.instanceof(File),
        filename: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'ARTIST') {
        throw new Error('Unauthorized - Artists only');
      }

      const blob = await uploadToBlob(input.filename, input.file.stream(), input.file.type);
      return blob;
    }),
});