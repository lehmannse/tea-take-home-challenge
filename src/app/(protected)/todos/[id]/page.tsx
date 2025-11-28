'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import type { Todo } from '@/components/todos/TodoTable';
import { ArrowLeft } from 'lucide-react';

export default function TodoDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isFetching, error } = useQuery({
    queryKey: ['todo', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/todos/${id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      return (await res.json()) as Todo;
    },
  });

  const [text, setText] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (data) {
      setText(data.todo);
      setCompleted(data.completed);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { todo: string; completed: boolean }) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update');
      return (await res.json()) as Todo;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ['todo', id] });
      const previousTodo = qc.getQueryData<Todo>(['todo', id]);
      // optimistic update detail
      if (previousTodo) {
        qc.setQueryData<Todo>(['todo', id], {
          ...previousTodo,
          todo: payload.todo,
          completed: payload.completed,
        });
      }
      // optimistic update in list page cache if present
      qc.setQueryData<any>(['todos', { page: 1, limit: 10 }], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          todos: prev.todos.map((t: Todo) =>
            t.id === Number(id)
              ? { ...t, todo: payload.todo, completed: payload.completed }
              : t
          ),
        };
      });
      return { previousTodo };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousTodo) {
        qc.setQueryData(['todo', id], ctx.previousTodo);
      }
    },
    onSuccess: (updated) => {
      qc.setQueryData(['todo', id], updated);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return await res.json();
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['todos'] });
      // optimistically remove from any loaded page
      qc.setQueryData<any>(['todos', { page: 1, limit: 10 }], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          total: Math.max(0, (prev.total ?? 0) - 1),
          todos: prev.todos.filter((t: Todo) => t.id !== Number(id)),
        };
      });
    },
    onSuccess: () => {
      router.replace('/todos');
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4" />
      </Button>

      {isFetching ? <p className="text-neutral-600">Loading...</p> : null}
      {error ? <p className="text-red-600">Failed to load todo.</p> : null}

      {data ? (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate({ todo: text, completed });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="todo">Todo</Label>
            <Input
              id="todo"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="h-4 w-4"
            />
            Completed
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
          {saveMutation.error ? (
            <p className="text-sm text-red-600">Update failed.</p>
          ) : null}
          {deleteMutation.error ? (
            <p className="text-sm text-red-600">Delete failed.</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
