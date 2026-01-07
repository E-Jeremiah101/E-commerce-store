import redis from "./redis.js";

const RECENTLY_VIEWED_PREFIX = "recently_viewed:";

const ensureConnected = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};


export const addToRecentlyViewed = async (userId, product) => {
  try {
    if (!userId || !product?._id) {
      return;
    }

    const key = `${RECENTLY_VIEWED_PREFIX}${userId}`;
    
    // Ensure Redis is connected
    await ensureConnected();
    
    // Get ALL existing recently viewed items
    const existingItems = await redis.lRange(key, 0, -1);
    
    if (existingItems.length > 0) {
      // Log duplicates before removal
      const productIds = existingItems.map(item => {
        try {
          const parsed = JSON.parse(item);
          return parsed._id?.toString();
        } catch {
          return null;
        }
      }).filter(id => id !== null);
      
    }
    
    // Create the product JSON string
    const productJson = JSON.stringify(product);
    
    // Remove ALL occurrences
    let removedCount = 0;
    let currentItems = [...existingItems];
    
    for (let i = 0; i < currentItems.length; i++) {
      try {
        const item = currentItems[i];
        const parsed = JSON.parse(item);
        
        if (parsed._id === product._id.toString()) {
          // Remove this specific occurrence
          const removed = await redis.lRem(key, 0, item); // 0 removes ALL occurrences
          if (removed > 0) {
            removedCount += removed;
            console.log(` Removed ${removed} duplicate(s) of product ${product._id}`);
          }
        }
      } catch (e) {
        console.log(" Could not parse item for duplicate check:", e.message);
      }
    }
    
    if (removedCount > 0) {
      console.log(`Removed total ${removedCount} duplicate(s)`);
    }
    
    // Add to beginning of list
    await redis.lPush(key, productJson);
    
    // Trim list to keep only last 10 items
    await redis.lTrim(key, 0, 9);
    
    // Set expiration (30 days)
    await redis.expire(key, 60 * 60 * 24 * 30);
    
  } catch (error) {
    console.error("Error adding to recently viewed:", error);
  }
};

// Get recently viewed products for a user
export const getRecentlyViewed = async (userId, limit = 8) => {
  try {
    if (!userId) {
      console.log(" No userId provided to getRecentlyViewed");
      return [];
    }

    const key = `${RECENTLY_VIEWED_PREFIX}${userId}`;

    await ensureConnected();

    let items = [];

    try {
      items = await redis.lRange(key, 0, limit - 1);
    } catch (modernError) {
      return [];
    }

    if (!items || items.length === 0) {
      console.log(" No items found in Redis");
      return [];
    }

    const parsedItems = items
      .map((item) => {
        try {
          const parsed = JSON.parse(item);

          // Ensure _id is a string
          if (parsed._id && typeof parsed._id !== "string") {
            parsed._id = parsed._id.toString();
          }

          // Ensure countInStock is calculated
          if (!parsed.countInStock && parsed.variants) {
            parsed.countInStock = parsed.variants.reduce(
              (sum, v) => sum + (v.countInStock || 0),
              0
            );
          }

          // Calculate discount
          if (
            !parsed.discountPercentage &&
            parsed.isPriceSlashed &&
            parsed.previousPrice
          ) {
            parsed.discountPercentage = (
              ((parsed.previousPrice - parsed.price) / parsed.previousPrice) *
              100
            ).toFixed(1);
          }

          return parsed;
        } catch (parseError) {
          console.error("Failed to parse item:", parseError.message);
          return null;
        }
      })
      .filter((item) => item !== null);

    return parsedItems;
  } catch (error) {
    console.error("Error getting recently viewed:", error);
    return [];
  }
};

// Clear recently viewed for a user
export const clearRecentlyViewed = async (userId) => {
  try {
    if (!userId) return;

    const key = `${RECENTLY_VIEWED_PREFIX}${userId}`;

    await ensureConnected();

    await redis.del(key);

    console.log(" Cleared recently viewed for user:", userId);
  } catch (error) {
    console.error(" Error clearing recently viewed:", error);
  }
};
