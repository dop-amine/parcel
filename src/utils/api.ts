import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/server/api/root';
import { httpBatchLink } from '@trpc/client';
import { getSession } from 'next-auth/react';
import superjson from 'superjson';

export const api = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

export function getTRPCClient() {
  return api.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include', // This is crucial for sending cookies
          });
        },
        async headers() {
          const session = await getSession();
          return {
            // Pass the session token if available
            ...(session?.user ? { 'x-session-user': JSON.stringify(session.user) } : {}),
          };
        },
        transformer: superjson,
      }),
    ],
  });
}