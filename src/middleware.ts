import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isArtist = token?.role === "ARTIST";
    const isExec = token?.role === "EXEC";
    const isOnArtistRoute = req.nextUrl.pathname.startsWith("/artist");
    const isOnExecRoute = req.nextUrl.pathname.startsWith("/exec");

    if (isArtist && isOnExecRoute) {
      return NextResponse.redirect(new URL("/artist", req.url));
    }

    if (isExec && isOnArtistRoute) {
      return NextResponse.redirect(new URL("/exec", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/artist/:path*", "/exec/:path*"],
};