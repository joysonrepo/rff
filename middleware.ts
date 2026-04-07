import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/students",
  "/staff",
  "/attendance",
  "/fees",
  "/reports",
  "/events",
  "/settings",
  "/enrollments",
  "/courses",
  "/notifications",
  "/marks",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("rff_session")?.value;

  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/staff/:path*",
    "/attendance/:path*",
    "/fees/:path*",
    "/reports/:path*",
    "/events/:path*",
    "/settings/:path*",
    "/enrollments/:path*",
    "/courses/:path*",
    "/notifications/:path*",
    "/marks/:path*",
    "/login",
  ],
};
