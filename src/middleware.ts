import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/super-admin/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes & API auth routes — ochiq
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // NextAuth v5 session cookie check (pure Edge-safe)
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  // Agar login qilmagan bo'lsa — login sahifasiga yo'naltirish
  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|apple-icon.png|icon.png|.*\\.png$|.*\\.svg$).*)",
  ],
};

