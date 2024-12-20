import type { PageServerLoad } from './$types';
import { getAllStatusUpdates, getCollectionCount } from '$lib/db/collections';

export const load = (async () => {
	// get statusUpdates from MongoDB
	const statusUpdates = await getAllStatusUpdates();
	const collectionCounts: { [key: string]: number } = {};
	for (const collectionName of ['files', 'chunks', 'candidates', 'clones']) {
		collectionCounts[collectionName] = await getCollectionCount(collectionName);
	}
	return { statusUpdates, collectionCounts };
}) satisfies PageServerLoad;
