import { getDB } from '$lib/db/mongo';
import { type Document } from 'mongodb';

type CollectionUpdates = {
	timestamp: number;
	message: number;
};

export type CollectionStats = {
	timestamp: number;
	count: number;
};

export type ProcessingMetrics = {
	processingRate: number; // documents per second
	timePerDocument: number; // milliseconds per document
};

const db = getDB();

export async function getAllStatusUpdates(): Promise<Document[]> {
	// get all statusUpdates entries from MongoDB
	return await db.collection('statusUpdates').find({}).project({ _id: 0 }).toArray();
}

export async function getCollectionCount(collectionName: string): Promise<number> {
	// get the count of the requested collection from MongoDB
	return await db.collection(collectionName).countDocuments({});
}

export async function getCollectionStats(collectionName: string): Promise<ProcessingMetrics> {
	const currentCount = await getCollectionCount(collectionName);

	if (currentCount == 0) {
		return {
			processingRate: 0,
			timePerDocument: 0
		};
	}

	const currentStatusUpdates = await getAllStatusUpdates();

	let startTimeUpdate = null;
	if (currentStatusUpdates.length > 0) {
		switch (collectionName) {
			case 'files': {
				startTimeUpdate = currentStatusUpdates.find((update: Document) =>
					(update as CollectionUpdates).message
						.toString()
						.startsWith('Reading and Processing files')
				);
				break;
			}
			case 'chunks': {
				startTimeUpdate = currentStatusUpdates.find((update: Document) =>
					(update as CollectionUpdates).message.toString().startsWith('Storing chunks')
				);
				break;
			}
			case 'candidates': {
				// If the clone expansion process has started, we calculate the processing rate as the candidates are being analazyed and deleted
				if (currentStatusUpdates.length > 4) {
					startTimeUpdate = currentStatusUpdates.find((update: Document) =>
						(update as CollectionUpdates).message.toString().startsWith('Expanding Candidates')
					);

					const foundCandidatesUpdate = currentStatusUpdates.find((update: Document) =>
						(update as CollectionUpdates).message.toString().startsWith('Found')
					);

					if (foundCandidatesUpdate) {
						const totalCandidtes = parseInt(foundCandidatesUpdate.message.toString().split(' ')[1]);
						currentCount = totalCandidtes - currentCount;
					}
				} else {
				startTimeUpdate = currentStatusUpdates.find((update: Document) =>
					(update as CollectionUpdates).message
						.toString()
						.startsWith('Identifying Clone Candidates')
				);
				}

				break;
			}
			case 'clones': {
				startTimeUpdate = currentStatusUpdates.find((update: Document) =>
					(update as CollectionUpdates).message.toString().startsWith('Expanding Candidates')
				);
				break;
			}
			default: {
				startTimeUpdate = null;
				break;
			}
		}
	}

	if (!startTimeUpdate) {
		return {
			processingRate: 0,
			timePerDocument: 0
		};
	}

	let endTime;
	if (currentStatusUpdates.indexOf(startTimeUpdate) == currentStatusUpdates.length - 1) {
		endTime = Date.now();
	} else {
		endTime = new Date(
			currentStatusUpdates[currentStatusUpdates.indexOf(startTimeUpdate) + 1].timestamp
		).getTime();
	}

	const startTime = new Date(startTimeUpdate.timestamp);
	const timeElapsedSeconds = (endTime - startTime.getTime()) / 1000;

	// Avoid division by zero
	if (timeElapsedSeconds === 0 || currentCount === 0) {
		return {
			processingRate: 0,
			timePerDocument: 0
		};
	}

	const processingRate = currentCount / timeElapsedSeconds; // items per second
	const timePerDocument = (timeElapsedSeconds * 1000) / currentCount; // ms per item

	return {
		processingRate,
		timePerDocument
	};
}
