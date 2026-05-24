import { Redis } from "@upstash/redis";

const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedis ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
}) : null;

const memory = globalThis.__crackMemoryStore || new Map();
globalThis.__crackMemoryStore = memory;

export async function getJSON(key, fallback = null) {
  if (redis) {
    const value = await redis.get(key);
    return value ?? fallback;
  }
  return memory.has(key) ? memory.get(key) : fallback;
}

export async function setJSON(key, value) {
  if (redis) return redis.set(key, value);
  memory.set(key, value);
  return "OK";
}

export async function incr(key) {
  if (redis) return redis.incr(key);
  const next = Number(memory.get(key) || 0) + 1;
  memory.set(key, next);
  return next;
}

export async function del(key) {
  if (redis) return redis.del(key);
  memory.delete(key);
  return 1;
}

export async function nowISO() {
  return new Date().toISOString();
}
