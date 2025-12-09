import mongoose from "mongoose";

// Extend the Node.js global type to cache the connection across hot reloads.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

// Fail fast if the env var is missing so we notice during boot.
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

// Reuse the same connection during dev to avoid socket exhaustion.
const cached = global._mongooseConn || {
  conn: null as typeof mongoose | null,
  promise: null as Promise<typeof mongoose> | null,
};

global._mongooseConn = cached;

export async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection when available (avoids extra sockets in dev).
  if (cached.conn) {
    return cached.conn;
  }

  // Create a new connection promise once.
  if (!cached.promise) {
    mongoose.set("strictQuery", true); // Enforce strict querying.
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
