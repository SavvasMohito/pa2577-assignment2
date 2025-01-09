import { getDB } from '$lib/db/mongo';
import { type Document } from 'mongodb';

export type CollectionStats = {
	timestamp: number;
	count: number;
};
export type ProcessingMetrics = {
	processingRate: number; // documents per second
	timePerDocument: number; // milliseconds per document
};

const collectionHistory: Map<string, CollectionStats[]> = new Map();
const db = getDB();

export async function getAllStatusUpdates(): Promise<Document[]> {
	// get all statusUpdates entries from MongoDB
	return await db.collection('statusUpdates').find({}).project({ _id: 0 }).toArray();
}

export async function getCollectionCount(collectionName: string): Promise<number> {
	// get the count of the requested collection from MongoDB
	return await db.collection(collectionName).countDocuments({});
}

export async function getCollectionCountWithStats(
	collectionName: string
): Promise<ProcessingMetrics> {
	const currentCount = await getCollectionCount(collectionName);
	const currentTime = Date.now();

	if (!collectionHistory.has(collectionName)) {
		collectionHistory.set(collectionName, []);
	}

	const history = collectionHistory.get(collectionName)!;
	history.push({ timestamp: currentTime, count: currentCount });

	// Keep last 10 minutes of data
	const tenMinutesAgo = currentTime - 10 * 60 * 1000;
	while (history.length > 0 && history[0].timestamp < tenMinutesAgo) {
		history.shift();
	}

	// Calculate processing metrics
	if (history.length > 1) {
		const oldest = history[0];
		const timeSpan = (currentTime - oldest.timestamp) / 1000; // in seconds
		const countDiff = currentCount - oldest.count;

		const processingRate = countDiff / timeSpan;
		const timePerDocument = (timeSpan * 1000) / countDiff; // in milliseconds

		return {
			processingRate,
			timePerDocument
		};
	}

	return {
		processingRate: 0,
		timePerDocument: 0
	};
}
