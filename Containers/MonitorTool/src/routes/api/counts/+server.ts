import { getCollectionCount } from '$lib/db/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const collectionCounts: { [key: string]: number } = {};
	for (const collectionName of ['files', 'chunks', 'candidates', 'clones']) {
		collectionCounts[collectionName] = await getCollectionCount(collectionName);
	}
	return new Response(JSON.stringify({ collectionCounts }), {
		headers: { 'Content-Type': 'application/json' }
	});
};
