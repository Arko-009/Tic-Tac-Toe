import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_MONGODB_URI = 'mongodb+srv://arkobag712409:8H4XiT373RVx3xdg@cluster0.8lvaz.mongodb.net/tictactoe?retryWrites=true&w=majority';
const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

let client = null;
let db = null;
let connectionPromise = null;

export async function connectDB() {
  if (db) return db;
  if (connectionPromise) return connectionPromise;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  connectionPromise = (async () => {
    try {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
      });

      await client.connect();
      db = client.db('tictactoe');
      console.log('✅ Connected successfully to MongoDB Atlas (database: tictactoe)');

      // Ensure index on 'name' for case-insensitive queries & uniqueness
      const collection = db.collection('leaderboard');
      await collection.createIndex(
        { name: 1 },
        {
          collation: { locale: 'en', strength: 2 },
          unique: true,
        }
      ).catch((e) => {
        console.warn('Index creation notice:', e.message);
      });

      return db;
    } catch (error) {
      connectionPromise = null;
      console.error('❌ Failed to connect to MongoDB Atlas:', error.message);
      throw error;
    }
  })();

  return connectionPromise;
}

export function getDb() {
  return db;
}

export async function getLeaderboardCollection() {
  const database = await connectDB();
  return database.collection('leaderboard');
}

export async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    connectionPromise = null;
    console.log('MongoDB connection closed.');
  }
}
