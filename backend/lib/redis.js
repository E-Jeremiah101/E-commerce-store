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
      if (redis > 10) {
        console.error("❌ Could not reconnect to Redis after 10 attempts.");
        return new Error("Redis connection failed");
      }
      return Math.min(retries * 100, 3000); // backoff: up to 3s
    }
  },
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.log("❌ Redis Client Error", err));
redis.on("reconnecting", () => console.log("♻️ Redis reconnecting..."));
redis.on("end", () => console.error("🔌 Redis connection closed"));

// let isConnected = false;

export const connectRedis = async() =>{
  if (!redis.isOpen){
    await redis.connect();
    // isConnected = true;
    console.log("✅ Connected to Redis");
  }
};


export default redis;

