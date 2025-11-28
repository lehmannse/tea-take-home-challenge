import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fetchMe } from "@/lib/server/auth";

export type Todo = {
	id: number;
	todo: string;
	completed: boolean;
	userId: number;
};

type Store = {
	nextId: number;
	users: Record<number, { todos: Todo[] }>;
};

// Use ephemeral tmp dir in production/serverless where repo filesystem is read-only.
// Keep project local ".data" during local dev.
const BASE_DIR =
	process.env.NODE_ENV === "production" ? os.tmpdir() : process.cwd();
const DATA_DIR = path.join(BASE_DIR, ".data");
const DATA_FILE = path.join(DATA_DIR, "todos.json");

async function ensureDataFile(): Promise<void> {
	try {
		await fs.mkdir(DATA_DIR, { recursive: true });
		await fs.access(DATA_FILE);
	} catch {
		const initial: Store = { nextId: 1, users: {} };
		await atomicWrite(JSON.stringify(initial, null, 2));
	}
}

async function atomicWrite(contents: string): Promise<void> {
	const tmp = `${DATA_FILE}.tmp`;
	await fs.writeFile(tmp, contents, "utf8");
	await fs.rename(tmp, DATA_FILE);
}

async function readStore(): Promise<Store> {
	await ensureDataFile();
	const buf = await fs.readFile(DATA_FILE, "utf8");
	const parsed = JSON.parse(buf) as Store;
	// backfill nextId if missing
	if (!parsed.nextId || parsed.nextId < 1) {
		let maxId = 0;
		for (const u of Object.values(parsed.users)) {
			for (const t of u.todos) maxId = Math.max(maxId, t.id);
		}
		parsed.nextId = maxId + 1;
	}
	return parsed;
}

async function writeStore(store: Store): Promise<void> {
	await atomicWrite(JSON.stringify(store, null, 2));
}

export async function ensureUserHydrated(token: string): Promise<number> {
	// Get user id via auth/me using provided token
	const me = await fetchMe(token);
	if (!me) throw new Error("Unauthorized");
	const userId = me.id;

	const store = await readStore();
	if (!store.users[userId]) {
		// Hydrate from DummyJSON (fetch all todos for user)
		const todos = await fetchAllTodosForUser(userId, token);
		store.users[userId] = { todos };
		// Update nextId to exceed max existing
		for (const t of todos) {
			if (t.id >= store.nextId) store.nextId = t.id + 1;
		}
		await writeStore(store);
	}
	return userId;
}

async function fetchAllTodosForUser(userId: number, token: string): Promise<Todo[]> {
	const all: Todo[] = [];
	const limit = 100;
	let skip = 0;
	// Loop until no more items
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const res = await fetch(
			`https://dummyjson.com/todos/user/${userId}?limit=${limit}&skip=${skip}`,
			{
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
				cache: "no-store",
			},
		);
		if (!res.ok) break;
		const data = (await res.json()) as { todos: Todo[]; total: number };
		all.push(...data.todos);
		skip += limit;
		if (all.length >= (data.total ?? all.length)) break;
		if (data.todos.length === 0) break;
	}
	return all;
}

export async function getTodosForUser(userId: number): Promise<Todo[]> {
	const store = await readStore();
	return store.users[userId]?.todos ?? [];
}

export async function getTodoForUser(userId: number, id: number): Promise<Todo | undefined> {
	const store = await readStore();
	return store.users[userId]?.todos.find((t) => t.id === id);
}

export async function createTodoForUser(
	userId: number,
	input: { todo: string; completed: boolean },
): Promise<Todo> {
	const store = await readStore();
	if (!store.users[userId]) store.users[userId] = { todos: [] };
	const newTodo: Todo = {
		id: store.nextId++,
		todo: input.todo,
		completed: input.completed,
		userId,
	};
	store.users[userId].todos.unshift(newTodo);
	await writeStore(store);
	return newTodo;
}

export async function updateTodoForUser(
	userId: number,
	id: number,
	patch: Partial<Pick<Todo, "todo" | "completed">>,
): Promise<Todo | undefined> {
	const store = await readStore();
	const list = store.users[userId]?.todos;
	if (!list) return undefined;
	const idx = list.findIndex((t) => t.id === id);
	if (idx < 0) return undefined;
	const updated = { ...list[idx], ...patch };
	list[idx] = updated;
	await writeStore(store);
	return updated;
}

export async function deleteTodoForUser(userId: number, id: number): Promise<boolean> {
	const store = await readStore();
	const list = store.users[userId]?.todos;
	if (!list) return false;
	const before = list.length;
	store.users[userId]!.todos = list.filter((t) => t.id !== id);
	const changed = store.users[userId]!.todos.length !== before;
	if (changed) await writeStore(store);
	return changed;
}


