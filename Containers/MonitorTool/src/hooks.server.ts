import schedule from 'node-schedule';
import {
	calculateStatistics,
	getCollectionCount,
	storeStats,
	type ProcessingMetrics
} from '$lib/db/collections';

// cron job calculating and collecting analytics every 10 seconds
const job = schedule.scheduleJob('*/10 * * * * *', async function () {
	const collectionStats: { [key: string]: { count: number; metrics: ProcessingMetrics } } = {};

	for (const collectionName of ['files', 'chunks', 'candidates', 'clones']) {
		const count = await getCollectionCount(collectionName);
		const metrics = await calculateStatistics(collectionName);
		collectionStats[collectionName] = { count, metrics };
	}

	storeStats(collectionStats);
});
