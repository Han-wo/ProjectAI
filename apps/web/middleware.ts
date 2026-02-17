import { NextResponse } from "next/server";
import { type NextRequestWithAuth, withAuth } from "next-auth/middleware";

export default withAuth(
  (request: NextRequestWithAuth) => {
    const isSignedIn = Boolean(request.nextauth.token);
    const isLoginPage = request.nextUrl.pathname.startsWith("/login");

    if (!isSignedIn && !isLoginPage) {
      return NextResponse.redirect(new URL("/login", request.nextUrl));
    }

    if (isSignedIn && isLoginPage) {
      return NextResponse.redirect(new URL("/", request.nextUrl));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login"
    },
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/login")) {
          return true;
        }

        return Boolean(token);
      }
    }
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
