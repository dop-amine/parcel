import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';
import { NextResponse } from 'next/server';

const handler = async (req: Request) => {
  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError({ error, path }) {
      console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
      if (error.cause) {
        console.error('Error cause:', error.cause);
      }
    },
  });

  // Add CORS headers
  const corsResponse = new NextResponse(response.body, response);
  corsResponse.headers.set("Access-Control-Allow-Origin", "*");
  corsResponse.headers.set("Access-Control-Request-Method", "*");
  corsResponse.headers.set("Access-Control-Allow-Methods", "OPTIONS,GET,POST");
  corsResponse.headers.set("Access-Control-Allow-Headers", "*");
  corsResponse.headers.set("Access-Control-Allow-Credentials", "true");

  return corsResponse;
};

export { handler as GET, handler as POST };