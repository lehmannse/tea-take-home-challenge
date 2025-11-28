'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (payload: { username: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      return (await res.json()) as { ok: boolean };
    },
    onSuccess: () => router.replace('/todos'),
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Log in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutate({ username, password });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="emilys"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600">
                Login failed. Check your credentials.
              </p>
            ) : null}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Logging in...' : 'Log in'}
            </Button>
            <p className="text-xs text-neutral-500">
              Try: username <span className="font-medium">emilys</span>,
              password <span className="font-medium">emilyspass</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
