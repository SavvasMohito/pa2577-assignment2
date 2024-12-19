import { DBHOST } from '$env/static/private';
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://dbstorage');

// connect to the database
export async function connect(): Promise<void> {
	await client.connect();
}

// disconnect from the database
export async function disconnect(): Promise<void> {
	await client.close();
}

// get the database
export function getDB(): any {
	return client.db('cloneDetector');
}
