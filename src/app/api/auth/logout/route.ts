import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/server/auth";

export async function POST() {
	const resp = NextResponse.json({ ok: true }, { status: 200 });
	clearAuthCookie(resp);
	return resp;
}


