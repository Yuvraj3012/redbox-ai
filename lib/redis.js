import Redis from "ioredis";

let redis;

export function getRedis() {
  if (!process.env.REDIS_URL) return null;

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      connectTimeout: 5000,
    });
    redis.connect().catch(() => {});
    redis.on('error', () => {}); // silence unhandled errors
  }

  return redis;
}

export async function getCache(key) {
  try {
    const client = getRedis();
    if (!client) return null;
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function setCache(key, value) {
  try {
    const client = getRedis();
    if (!client) return false;
    await client.set(key, JSON.stringify(value), 'EX', 3600);
    return true;
  } catch {
    return false;
  }
}

export async function getAgentMemory(key) {
  return getCache(`redbox:memory:${key}`);
}

export async function setAgentMemory(key, value) {
  return setCache(`redbox:memory:${key}`, value);
}

export async function pingRedis() {
  try {
    const client = getRedis();
    if (!client) return false;
    await client.ping();
    return true;
  } catch {
    return false;
  }
}
