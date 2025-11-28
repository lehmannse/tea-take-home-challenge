'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const router = useRouter();
  const onSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };
  return (
    <Button variant="outline" onClick={onSignOut} className="gap-2">
      <LogOut className="w-4 h-4" />
      Log out
    </Button>
  );
}
