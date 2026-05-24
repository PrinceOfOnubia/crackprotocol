import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const hasRedis = Boolean(redisUrl && redisToken);
const redis = hasRedis ? new Redis({
  url: redisUrl,
  token: redisToken
}) : null;
const requiresRedis = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");

const memory = globalThis.__crackMemoryStore || new Map();
globalThis.__crackMemoryStore = memory;

export function storageStatus() {
  return {
    configured: hasRedis || !requiresRedis,
    mode: hasRedis ? "upstash" : "memory",
    requiresRedis,
    acceptedEnv: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN"]
  };
}

function assertStorage() {
  if (!hasRedis && requiresRedis) {
    const error = new Error("Access is temporarily unavailable. Please try again shortly.");
    error.statusCode = 503;
    throw error;
  }
}

export async function getJSON(key, fallback = null) {
  assertStorage();
  if (redis) {
    const value = await redis.get(key);
    return value ?? fallback;
  }
  return memory.has(key) ? memory.get(key) : fallback;
}

export async function setJSON(key, value) {
  assertStorage();
  if (redis) return redis.set(key, value);
  memory.set(key, value);
  return "OK";
}

export async function incr(key) {
  assertStorage();
  if (redis) return redis.incr(key);
  const next = Number(memory.get(key) || 0) + 1;
  memory.set(key, next);
  return next;
}

export async function del(key) {
  assertStorage();
  if (redis) return redis.del(key);
  memory.delete(key);
  return 1;
}

export async function nowISO() {
  return new Date().toISOString();
}
