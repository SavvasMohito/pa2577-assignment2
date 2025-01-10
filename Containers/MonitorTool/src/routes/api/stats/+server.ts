import {
	calculateStatistics,
	getCollectionCount,
	storeStats,
	getAllStatistics,
	type ProcessingMetrics
} from '$lib/db/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const collectionStats: { [key: string]: { count: number; metrics: ProcessingMetrics } } = {};

	for (const collectionName of ['files', 'chunks', 'candidates', 'clones']) {
		const count = await getCollectionCount(collectionName);
		const metrics = await calculateStatistics(collectionName);
		collectionStats[collectionName] = { count, metrics };
	}

	storeStats(collectionStats);
	const allStatistics = await getAllStatistics();

	return new Response(JSON.stringify({ allStatistics }), {
		headers: { 'Content-Type': 'application/json' }
	});
};
