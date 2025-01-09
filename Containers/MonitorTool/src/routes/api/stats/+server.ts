import {
	getCollectionCountWithStats,
	getCollectionCount,
	type ProcessingMetrics
} from '$lib/db/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const collectionStats: { [key: string]: { count: number; metrics: ProcessingMetrics } } = {};

	for (const collectionName of ['files', 'chunks', 'candidates', 'clones']) {
		const count = await getCollectionCount(collectionName);
		const metrics = await getCollectionCountWithStats(collectionName);
		collectionStats[collectionName] = { count, metrics };
	}
	return new Response(JSON.stringify({ collectionStats }), {
		headers: { 'Content-Type': 'application/json' }
	});
};
