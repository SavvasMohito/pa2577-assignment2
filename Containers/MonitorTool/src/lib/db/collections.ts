import { getDB } from '$lib/db/mongo';
import { type Document } from 'mongodb';

const db = getDB();

export async function getCollection(
	collection_name: string,
	skip: number,
	limit: number
): Promise<Document[]> {
	// get repositories from MongoDB with skip and limit
	const data = await db
		.collection(collection_name)
		.find({})
		.project({ _id: 0 })
		.skip(skip)
		.limit(limit)
		.toArray();

	// return JSON response
	return data;
}

export async function searchCollection(
	collection_name: string,
	search: string
): Promise<Document[]> {
	// get repositories from MongoDB with search query and regex options
	const data = await db
		.collection(collection_name)
		.find({ title: { $regex: search, $options: 'i' } })
		.project({ _id: 0 })
		.toArray();

	// return JSON response
	return data;
}
