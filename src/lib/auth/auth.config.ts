import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parol", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { school: { select: { id: true, slug: true, subscriptionStatus: true } } },
        });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        // Obuna holati tekshiruvi (Super Admin bundan mustasno)
        if (user.role === "SCHOOL_ADMIN" && user.school?.subscriptionStatus === "suspended") {
          throw new Error("SUBSCRIPTION_SUSPENDED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          schoolId: user.schoolId,
          schoolSlug: user.school?.slug ?? null,
          setupDone: user.setupDone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId;
        token.schoolSlug = (user as any).schoolSlug;
        token.setupDone = (user as any).setupDone;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as string;
      session.user.schoolId = token.schoolId as string | null;
      session.user.schoolSlug = token.schoolSlug as string | null;
      session.user.setupDone = token.setupDone as boolean;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "jadvalai-dev-secret-key-2026-uzb-maktab-saas-platform-32chars-min",
  trustHost: true,
});
