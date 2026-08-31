import NextAuth from "next-auth";
import { auth } from "@/lib/auth/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/super-admin/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — ochiq
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const session = await auth();

  // Login yo'q — login sahifasiga
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /super-admin bo'limiga faqat SUPER_ADMIN kira oladi
  if (pathname.startsWith("/super-admin") && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Maktab Admin — setup wizard tugatilmagan bo'lsa /setup ga yo'naltir
  if (
    session.user.role === "SCHOOL_ADMIN" &&
    !session.user.setupDone &&
    !pathname.startsWith("/setup")
  ) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
