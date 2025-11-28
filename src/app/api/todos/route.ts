import { NextResponse, type NextRequest } from 'next/server';
import { getTokenFromCookies } from '@/lib/server/auth';
import {
  ensureUserHydrated,
  getTodosForUser,
  createTodoForUser,
} from '@/lib/server/store/todosStore';

export async function GET(req: NextRequest) {
  const token = getTokenFromCookies(req);
  if (!token)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.max(
    1,
    Math.min(50, Number(searchParams.get('limit') ?? '10'))
  );
  const skip = (page - 1) * limit;

  const userId = await ensureUserHydrated(token);

  const all = await getTodosForUser(userId);
  const total = all.length;
  const slice = all.slice(skip, skip + limit);
  return NextResponse.json(
    { page, limit, total, todos: slice },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const token = getTokenFromCookies(req);
  if (!token)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const userId = await ensureUserHydrated(token);

  const body = (await req.json()) as { todo?: string; completed?: boolean };
  if (!body?.todo || typeof body.todo !== 'string') {
    return NextResponse.json({ message: 'Missing todo text' }, { status: 400 });
  }
  const created = await createTodoForUser(userId, {
    todo: body.todo,
    completed: Boolean(body.completed),
  });
  return NextResponse.json(created, { status: 201 });
}
