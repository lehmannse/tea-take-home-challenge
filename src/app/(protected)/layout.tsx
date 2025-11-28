import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AUTH_COOKIE_NAME } from '@/lib/server/auth';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    redirect('/login');
  }
  return (
    <div>
      <div className="flex items-center justify-between border-b bg-white px-6 py-3">
        <p className="text-sm font-medium">Todos</p>
        <SignOutButton />
      </div>
      {children}
    </div>
  );
}
