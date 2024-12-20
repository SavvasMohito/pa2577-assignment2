import { env } from '$env/dynamic/private';
import { type Db, MongoClient } from 'mongodb';

const client = new MongoClient(env.DBHOST || "");

// connect to the database
export async function connect(): Promise<void> {
	await client.connect();
}

// disconnect from the database
export async function disconnect(): Promise<void> {
	await client.close();
}

// get the database
export function getDB(): Db {
	return client.db(env.DBNAME);
}
