import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes
      const publicRoutes = ["/login", "/register"];
      const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

      if (!isLoggedIn && !isPublic) {
        return false; // Otomatis redirect ke signIn page (/login)
      }

      if (isLoggedIn && isPublic) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [], // Dikonfigurasi lengkap di auth.ts (Node.js runtime)
} satisfies NextAuthConfig;
