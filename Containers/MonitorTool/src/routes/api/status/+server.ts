import { getAllStatusUpdates } from '$lib/db/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const statusUpdates = await getAllStatusUpdates();
	return new Response(JSON.stringify({ statusUpdates }), {
		headers: { 'Content-Type': 'application/json' }
	});
};
