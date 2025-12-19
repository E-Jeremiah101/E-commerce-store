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

export async function acquireWebhookLock(transactionId, timeoutMs = 45000) {
  try {
    const lockKey = `webhook_lock:${transactionId}`;
    const lockValue = `${transactionId}_${Date.now()}`;
    
    // For Redis v4+, use SET with NX and PX options
    const acquired = await redis.set(lockKey, lockValue, {
      NX: true, // Only set if not exists
      PX: timeoutMs // Expire after timeout in milliseconds
    });
    
    console.log(
      `🔒 Lock acquisition ${
        acquired ? "successful" : "failed"
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

export async function storeReservation(reservationId, reservationData) {
  try {
    await redis.set(
      `reservation:${reservationId}`,
      JSON.stringify(reservationData),
      {
        EX: reservationData.timeoutMinutes * 60 // TTL in seconds
      }
    );
    console.log(`✅ Stored reservation: ${reservationId}`);
  } catch (error) {
    console.error('❌ Failed to store reservation:', error);
    throw error;
  }
}

export async function getReservation(reservationId) {
  try {
    const data = await redis.get(`reservation:${reservationId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Failed to get reservation:', error);
    return null;
  }
}

export async function deleteReservation(reservationId) {
  try {
    await redis.del(`reservation:${reservationId}`);
    console.log(`✅ Deleted reservation: ${reservationId}`);
  } catch (error) {
    console.error('❌ Failed to delete reservation:', error);
    throw error;
  }
}

export async function storeReleasedReservation(reservationId, releaseData) {
  try {
    // Store released marker for 1 hour
    await redis.set(
      `released_${reservationId}`,
      JSON.stringify(releaseData),
      {
        EX: 60 * 60 // 1 hour TTL
      }
    );
  } catch (error) {
    console.error('❌ Failed to store released reservation:', error);
    throw error;
  }
}

export async function getReleasedReservation(reservationId) {
  try {
    const data = await redis.get(`released_${reservationId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Failed to get released reservation:', error);
    return null;
  }
}

export const connectRedis = async() =>{
  if (!redis.isOpen){
    await redis.connect();
    console.log("Connected to Redis");
  }
};


export default redis;

