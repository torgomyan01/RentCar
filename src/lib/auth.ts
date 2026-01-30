// src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
    signOut: '/admin/login',
    error: '/admin/login',
  },
  // Cookie configuration for production (Vercel)
  // NextAuth v4 automatically adds __Secure- prefix when secure is true
  // and NEXTAUTH_URL starts with https://
  useSecureCookies:
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    (process.env.NEXTAUTH_URL || '').startsWith('https://'),
  cookies: {
    sessionToken: {
      // NextAuth v4: When secure is true and useSecureCookies is true,
      // NextAuth automatically adds __Secure- prefix to cookie name
      // But getServerSession reads cookies using the name specified here
      // So we need to match what we set in adminLoginAction
      name:
        process.env.NODE_ENV === 'production' ||
        process.env.VERCEL === '1' ||
        (process.env.NEXTAUTH_URL || '').startsWith('https://')
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure:
          process.env.NODE_ENV === 'production' ||
          process.env.VERCEL === '1' ||
          (process.env.NEXTAUTH_URL || '').startsWith('https://'),
        // Don't set domain - let browser handle it automatically
        // domain: undefined,
      },
    },
  },
  providers: [
    // Admin credentials provider
    Credentials({
      id: 'admin',
      name: 'Admin',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        const username = (creds?.username as string)?.trim() || '';
        const password = String(creds?.password ?? '');

        if (!username || !password) {
          return null;
        }

        // Import admin credentials

        return {
          id: 'admin',
          name: username,
          email: `${username}@admin.local`,
          role: 'admin',
          type: 'admin',
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Handle admin authentication
      if (
        user &&
        ((user as any).type === 'admin' || (user as any).role === 'admin')
      ) {
        token.sub = (user as any).id ?? 'admin';
        token.email = (user as any).email;
        (token as any).role = 'admin';
        (token as any).type = 'admin';
        (token as any).username = (user as any).name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        // Handle admin session
        (session.user as any).id = token.sub;
        (session.user as any).email = token.email;
        (session.user as any).role = 'admin';
        (session.user as any).type = 'admin';
        (session.user as any).username = (token as any).username;
        (session.user as any).name = (token as any).username || token.email;
      }
      return session;
    },
  },
};
