const { createClient } = require("redis");

let redisClient;

async function getRedis() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: 6379,
    },
    password: process.env.REDIS_PASSWORD,
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err);
  });
  await redisClient.connect();

  return redisClient;
}

module.exports = { getRedis };
