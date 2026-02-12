// src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

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
        try {
          const username = (creds?.username as string)?.trim() || '';
          const password = String(creds?.password ?? '');

          console.log('[Auth] Attempting login for username:', username);

          if (!username || !password) {
            console.log('[Auth] Missing username or password');
            return null;
          }

          // Find user in database
          let user;
          try {
            user = await prisma.user.findUnique({
              where: { username },
            });
            console.log('[Auth] Database query result:', user ? 'User found' : 'User not found');
          } catch (dbError: any) {
            console.error('[Auth] Database error:', dbError);
            console.error('[Auth] Database error message:', dbError?.message);
            throw dbError;
          }

          if (!user) {
            console.log('[Auth] User not found in database:', username);
            return null;
          }

          console.log('[Auth] User found:', {
            id: user.id,
            username: user.username,
            role: user.role,
            hasPassword: !!user.password,
          });

          // Check if user is admin
          if (user.role !== 'admin') {
            console.log('[Auth] User is not admin:', {
              username,
              role: user.role,
            });
            return null;
          }

          // Verify password
          let isValidPassword = false;
          try {
            isValidPassword = await bcrypt.compare(password, user.password);
            console.log('[Auth] Password comparison result:', isValidPassword);
          } catch (bcryptError: any) {
            console.error('[Auth] Bcrypt error:', bcryptError);
            console.error('[Auth] Bcrypt error message:', bcryptError?.message);
            throw bcryptError;
          }

          if (!isValidPassword) {
            console.log('[Auth] Password mismatch for user:', username);
            return null;
          }

          console.log('[Auth] Authentication successful for:', username);
          return {
            id: user.id,
            name: user.username,
            email: user.email,
            role: user.role,
            type: 'admin',
          } as any;
        } catch (error: any) {
          console.error('[Auth] Error during authorization:', error);
          console.error('[Auth] Error details:', {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
          });
          return null;
        }
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
