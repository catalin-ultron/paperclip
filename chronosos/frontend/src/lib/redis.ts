import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export async function acquireLock(key: string, ttlSeconds = 60): Promise<boolean> {
  const result = await redis.set(key, "1", "EX", ttlSeconds, "NX");
  return result === "OK";
}

export async function releaseLock(key: string): Promise<void> {
  await redis.del(key);
}
