import Redis from "ioredis";

let client;

function getClient() {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
    client.connect().catch(() => {});
  }
  return client;
}

export async function cacheGet(key) {
  const redis = getClient();
  if (!redis) return null;
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
}

export async function cacheSet(key, value, ttlSeconds = 3600) {
  const redis = getClient();
  if (!redis) return false;
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  return true;
}
