import { DISPENSER_WEBHOOK_URL } from "@/lib/config";

export async function POST(req: Request) {
	try {
		if (!DISPENSER_WEBHOOK_URL) {
			return new Response(JSON.stringify({ error: "Webhook URL not configured" }), { status: 500 });
		}
		const body = await req.json().catch(() => ({}));
		const res = await fetch(DISPENSER_WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body || {}),
		});
		const text = await res.text();
		return new Response(text, { status: res.status });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500 });
	}
} 