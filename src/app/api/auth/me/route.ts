import { NextResponse, type NextRequest } from 'next/server';
import { getTokenFromCookies, fetchMe } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const token = getTokenFromCookies(req);
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const me = await fetchMe(token);
  if (!me) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(me, { status: 200 });
}
