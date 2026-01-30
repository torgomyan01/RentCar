import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const nextAuth = NextAuth(authOptions);

export const { auth, signIn, signOut } = nextAuth;
