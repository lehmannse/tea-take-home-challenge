"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Pagination({ total, limit }: { total: number; limit: number }) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
	const totalPages = Math.max(1, Math.ceil(total / limit));

	const setPage = (p: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", String(p));
		params.set("limit", String(limit));
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="flex items-center justify-between gap-2">
			<Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
				Previous
			</Button>
			<p className="text-sm text-neutral-600">
				Page {page} of {totalPages}
			</p>
			<Button
				variant="outline"
				disabled={page >= totalPages}
				onClick={() => setPage(page + 1)}
			>
				Next
			</Button>
		</div>
	);
}


