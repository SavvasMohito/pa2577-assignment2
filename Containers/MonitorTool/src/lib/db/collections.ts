import { getDB } from '$lib/db/mongo';
import { type Document } from 'mongodb';

const db = getDB();

export async function getAllStatusUpdates(): Promise<Document[]> {
	// get all statusUpdates entries from MongoDB
	return await db.collection('statusUpdates').find({}).project({ _id: 0 }).toArray();
}

export async function getCollectionCount(collectionName: string): Promise<number> {
	// get the count of the requested collection from MongoDB
	return await db.collection(collectionName).countDocuments({});
}
