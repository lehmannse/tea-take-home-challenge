import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'dj_token';

export function setAuthCookie(response: NextResponse, token: string): void {
  // HttpOnly so it's hidden from client JS; Secure assumed under HTTPS; Lax to allow same-site navigation
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}

export function getTokenFromCookies(
  req: Request | NextRequest
): string | undefined {
  // Handle NextRequest (has .cookies)
  const maybeNext = req as NextRequest;
  const fromApiRoute = maybeNext?.cookies?.get?.(AUTH_COOKIE_NAME)?.value;
  if (fromApiRoute) return fromApiRoute;
  // Fallback: parse Cookie header from standard Request
  const header = (req as Request).headers?.get?.('cookie');
  if (!header) return undefined;
  const parts = header.split(';').map((p) => p.trim());
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq);
    const val = part.slice(eq + 1);
    if (key === AUTH_COOKIE_NAME) return decodeURIComponent(val);
  }
  return undefined;
}

export async function fetchMe(token: string): Promise<{ id: number } | null> {
  const res = await fetch('https://dummyjson.com/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id: number };
  return data;
}
