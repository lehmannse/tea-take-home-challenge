import Link from "next/link";

export type Todo = {
	id: number;
	todo: string;
	completed: boolean;
	userId: number;
};

export function TodoTable({ todos }: { todos: Todo[] }) {
	return (
		<div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
			<table className="min-w-full text-sm">
				<thead className="bg-neutral-50">
					<tr>
						<th className="px-4 py-3 text-left font-medium text-neutral-600">Todo</th>
						<th className="px-4 py-3 text-left font-medium text-neutral-600">Completed</th>
						<th className="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{todos.map((t) => (
						<tr key={t.id} className="border-t">
							<td className="px-4 py-3">{t.todo}</td>
							<td className="px-4 py-3">
								{t.completed ? (
									<span className="text-green-600">Yes</span>
								) : (
									<span className="text-neutral-500">No</span>
								)}
							</td>
							<td className="px-4 py-3 text-right">
								<Link className="text-blue-600 hover:underline" href={`/todos/${t.id}`}>
									View
								</Link>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}


