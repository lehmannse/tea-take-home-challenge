'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { TodoTable, type Todo } from '@/components/todos/TodoTable';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

type TodosResponse = {
  todos: Todo[];
  total: number;
  limit: number;
  page: number;
};

export default function TodosPage() {
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.max(
    1,
    Math.min(50, Number(searchParams.get('limit') ?? '10'))
  );
  const qc = useQueryClient();
  const [newText, setNewText] = useState('');
  const [newCompleted, setNewCompleted] = useState(false);

  const { data, isFetching, error } = useQuery({
    queryKey: ['todos', { page, limit }],
    queryFn: async () => {
      const res = await fetch(`/api/todos?page=${page}&limit=${limit}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to load todos');
      return (await res.json()) as TodosResponse;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { todo: string; completed: boolean }) => {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create');
      return (await res.json()) as Todo;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ['todos'] });
      const key = ['todos', { page, limit }] as const;
      const previous = qc.getQueryData<TodosResponse>(key);
      // Optimistically add a temporary todo at top of current page
      if (previous) {
        const optimistic: Todo = {
          id: Math.floor(Math.random() * 1_000_000) * -1, // negative temp id
          todo: payload.todo,
          completed: payload.completed,
          userId: 0,
        };
        qc.setQueryData<TodosResponse>(key, {
          ...previous,
          total: previous.total + 1,
          todos: [optimistic, ...previous.todos].slice(0, previous.limit),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      const key = ['todos', { page, limit }] as const;
      if (ctx?.previous) {
        qc.setQueryData(key, ctx.previous);
      }
    },
    onSuccess: (created) => {
      const key = ['todos', { page, limit }] as const;
      const current = qc.getQueryData<TodosResponse>(key);
      if (current) {
        // Replace first temp item if any, else prepend
        const replaced = [...current.todos];
        const idx = replaced.findIndex(
          (t) => t.id < 0 && t.todo === created.todo
        );
        if (idx >= 0) replaced[idx] = created;
        else replaced.unshift(created);
        qc.setQueryData<TodosResponse>(key, {
          ...current,
          todos: replaced.slice(0, current.limit),
        });
      }
      setNewText('');
      setNewCompleted(false);
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Todos</h1>
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newText.trim()) return;
          createMutation.mutate({
            todo: newText.trim(),
            completed: newCompleted,
          });
        }}
      >
        <Input
          placeholder="New todo..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={newCompleted}
            onChange={(e) => setNewCompleted(e.target.checked)}
            className="h-4 w-4"
          />
          Completed
        </label>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add'}
        </Button>
      </form>

      {isFetching ? <p className="text-neutral-600">Loading...</p> : null}
      {error ? <p className="text-red-600">Failed to load todos.</p> : null}

      {data?.todos ? <TodoTable todos={data.todos} /> : null}

      {data ? <Pagination total={data.total} limit={limit} /> : null}
    </div>
  );
}
