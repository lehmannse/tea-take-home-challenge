import { NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/lib/server/auth';
import {
  ensureUserHydrated,
  getTodoForUser,
  updateTodoForUser,
  deleteTodoForUser,
} from '@/lib/server/store/todosStore';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const token = getTokenFromCookies(req);
  if (!token)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserHydrated(token);
  const url = new URL(req.url);
  const fallback = url.pathname.split('/').pop();
  const paramId = params?.id ?? fallback;
  const id = Number(paramId);
  if (!Number.isFinite(id))
    return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
  const todo = await getTodoForUser(userId, id);
  if (!todo)
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(todo, { status: 200 });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const token = getTokenFromCookies(req);
  if (!token)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserHydrated(token);
  const url = new URL(req.url);
  const fallback = url.pathname.split('/').pop();
  const paramId = params?.id ?? fallback;
  const id = Number(paramId);
  if (!Number.isFinite(id))
    return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
  const body = (await req.json()) as Partial<{
    todo: string;
    completed: boolean;
  }>;
  const updated = await updateTodoForUser(userId, id, body);
  if (!updated)
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const token = getTokenFromCookies(req);
  if (!token)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserHydrated(token);
  const url = new URL(req.url);
  const fallback = url.pathname.split('/').pop();
  const paramId = params?.id ?? fallback;
  const id = Number(paramId);
  if (!Number.isFinite(id))
    return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
  const ok = await deleteTodoForUser(userId, id);
  if (!ok) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
