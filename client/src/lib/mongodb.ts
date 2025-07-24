import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<db_username>:<db_password>@narrative-scaffolding.prvuku7.mongodb.net/?retryWrites=true&w=majority&appName=Narrative-Scaffolding';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global type declaration for server-side caching
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// Check if we're in a server environment
const isServer = typeof window === 'undefined';

// Only use global cache on server side
const getGlobalCache = (): MongooseCache => {
  if (isServer && typeof global !== 'undefined') {
    return (global as any).mongooseCache || { conn: null, promise: null };
  }
  // For client side, use a module-level cache
  return { conn: null, promise: null };
};

const cached: MongooseCache = getGlobalCache();

if (isServer && typeof global !== 'undefined') {
  (global as any).mongooseCache = cached;
}

async function connectToDatabase(): Promise<typeof mongoose> {
  // Prevent execution on client side
  if (typeof window !== 'undefined') {
    throw new Error('MongoDB connection should only be called on the server side');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
