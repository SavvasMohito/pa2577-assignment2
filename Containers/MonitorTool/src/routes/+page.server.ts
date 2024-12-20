import type { PageServerLoad } from './$types';
import { getCollection } from '$lib/db/collections';

export const load = (async () => {
	// get statusUpdates from MongoDB
	const statusUpdates = await getCollection('statusUpdates', 0, 10);

	return { data: statusUpdates };
}) satisfies PageServerLoad;
