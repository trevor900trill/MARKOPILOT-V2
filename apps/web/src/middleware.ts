import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = !!req.auth;
  const onboardingCompleted = (req.auth?.user as any)?.onboardingCompleted;
  const { nextUrl } = req;

  // 1. If not authenticated and trying to access protected routes, go to root
  if (!isAuth && (nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/onboarding"))) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // 2. If authenticated:
  if (isAuth) {
    // If trying to access dashboard but onboarding is not completed, go to onboarding
    if (nextUrl.pathname.startsWith("/dashboard") && !onboardingCompleted) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl));
    }

    // If trying to access onboarding but already completed, go to dashboard
    if (nextUrl.pathname.startsWith("/onboarding") && onboardingCompleted) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
