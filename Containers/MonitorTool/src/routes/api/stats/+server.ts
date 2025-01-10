import { getAllStatistics } from '$lib/db/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const allStatistics = await getAllStatistics();

	return new Response(JSON.stringify({ allStatistics }), {
		headers: { 'Content-Type': 'application/json' }
	});
};
