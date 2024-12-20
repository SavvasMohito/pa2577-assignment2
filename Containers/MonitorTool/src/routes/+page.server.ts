import type { PageServerLoad } from './$types';
import { getAllStatusUpdates } from '$lib/db/collections';

export const load = (async () => {
	// get statusUpdates from MongoDB
	const statusUpdates = await getAllStatusUpdates();
	return { statusUpdates };
}) satisfies PageServerLoad;
