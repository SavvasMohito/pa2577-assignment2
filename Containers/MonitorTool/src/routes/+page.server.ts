import type { PageServerLoad } from './$types';
import { getCollection } from '$lib/db/collections';

export const load = (async () => {
	// get repositories from MongoDB
	const statusUpdates = await getCollection('statusUpdates', 0, 10);

	console.log(statusUpdates);
	return { data: statusUpdates };
}) satisfies PageServerLoad;
