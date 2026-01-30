"use client";
import { SessionProvider } from "next-auth/react";

export function SesProviders({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
