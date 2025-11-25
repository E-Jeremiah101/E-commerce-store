import { createClient } from "redis";
import dotenv from 'dotenv';

dotenv.config() //Load .env variables

  const redis = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    reconnectStrategy: (retries) => {
      console.log(`🔄 Redis reconnect attempt #${retries}`);
      if (retries > 10) {
        console.error("❌ Could not reconnect to Redis after 10 attempts.");
        return new Error("Redis connection failed");
      }
      return Math.min(retries * 100, 3000); // backoff: up to 3s
    }
  },
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.log(" Redis Client Error", err));
redis.on("reconnecting", () => console.log("♻️ Redis reconnecting..."));
redis.on("end", () => console.error("🔌 Redis connection closed"));

// Redis Locking Functions
export async function acquireWebhookLock(transactionId, timeoutMs = 45000) {
  try {
    const lockKey = `webhook_lock:${transactionId}`;
    const lockValue = `${transactionId}_${Date.now()}`;
    const acquired = await redis.set(lockKey,lockValue, {
      NX: true, // Only set if not exists
      PX: timeoutMs // Expire after timeout
    });
    console.log(
      `🔒 Lock acquisition ${
        acquired === "OK" ? "successful" : "failed"
      } for: ${transactionId}`
    );
    return acquired === 'OK';
  } catch (error) {
    console.error('Redis lock acquisition failed:', error);
    return false;
  }
}

export async function releaseWebhookLock(transactionId) {
  try {
    const lockKey = `webhook_lock:${transactionId}`;
    await redis.del(lockKey);
    console.log(`🔓 Released Redis lock: ${lockKey}`);
  } catch (error) {
    console.error('Redis lock release failed:', error);
  }
}

export const connectRedis = async() =>{
  if (!redis.isOpen){
    await redis.connect();
    console.log("Connected to Redis");
  }
};


export default redis;

