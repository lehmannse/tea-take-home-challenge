import { NextResponse, type NextRequest } from 'next/server';
import { setAuthCookie } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    return NextResponse.json(
      { message: 'Missing credentials' },
      { status: 400 }
    );
  }

  // Call DummyJSON directly per docs: https://dummyjson.com/docs/auth
  const res = await fetch('https://dummyjson.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      expiresInMins: 30,
    }),
    // Including credentials matches the docs; harmless on server and future-proofs cookie passthrough.
    credentials: 'include',
    cache: 'no-store',
  });

  const json = (await res.json()) as unknown;

  if (!res.ok) {
    return NextResponse.json(json ?? { message: 'Login failed' }, {
      status: res.status || 500,
    });
  }

  type LoginSuccess = {
    accessToken?: string;
    token?: string;
    refreshToken?: string;
    id?: number;
    username?: string;
    [k: string]: unknown;
  };
  const data = json as Partial<LoginSuccess>;
  const token =
    typeof data.accessToken === 'string'
      ? data.accessToken
      : typeof data.token === 'string'
      ? data.token
      : undefined;
  if (!token) {
    return NextResponse.json(
      { message: 'Login failed: token missing' },
      { status: 500 }
    );
  }

  const resp = NextResponse.json({ ok: true }, { status: 200 });
  setAuthCookie(resp, token);
  return resp;
}
