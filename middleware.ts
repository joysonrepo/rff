import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedPaths = [
  "/dashboard",
  "/students",
  "/student-list",
  "/staff",
  "/staff-list",
  "/attendance",
  "/homework",
  "/news",
  "/fees",
  "/reports",
  "/events",
  "/settings",
  "/enrollments",
  "/courses",
  "/notifications",
  "/marks",
  "/achievements",
];

function getSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

async function hasValidSessionToken(token: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret) {
    return false;
  }

  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("rff_session")?.value;
  const isValidToken = token ? await hasValidSessionToken(token) : false;

  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isProtected && !isValidToken) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (token) {
      response.cookies.delete("rff_session");
    }
    return response;
  }

  if (pathname === "/login" && isValidToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/login" && token && !isValidToken) {
    const response = NextResponse.next();
    response.cookies.delete("rff_session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/student-list/:path*",
    "/staff/:path*",
    "/staff-list/:path*",
    "/attendance/:path*",
    "/homework/:path*",
    "/news/:path*",
    "/fees/:path*",
    "/reports/:path*",
    "/events/:path*",
    "/settings/:path*",
    "/enrollments/:path*",
    "/courses/:path*",
    "/notifications/:path*",
    "/marks/:path*",
    "/achievements/:path*",
    "/login",
  ],
};
