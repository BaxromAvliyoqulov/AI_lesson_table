import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    schoolId: string | null;
    schoolSlug: string | null;
    setupDone: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      schoolId: string | null;
      schoolSlug: string | null;
      setupDone: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    schoolId: string | null;
    schoolSlug: string | null;
    setupDone: boolean;
  }
}
