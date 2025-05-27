const { getRedis } = require("../config/redisConfig");

const OTP_EXPIRY = 10 * 60; // 10 minutes
const RATE_LIMIT_WINDOW = 10 * 60; // 10 min in seconds;
const MAX_REQUESTS = 5;

const saveOtp = async (phone, otp) => {
  const otpKey = `otp:${phone}`;
  const redis = await getRedis();
  await redis.set(otpKey, otp, { EX: OTP_EXPIRY });
};

const verifyOtp = async (phone, code) => {
  const redis = await getRedis();
  const otpKey = `otp:${phone}`;
  const storedOtp = await redis.get(otpKey);

  if (!storedOtp) {
    return {
      success: false,
      reason: "not_found",
      message: "OTP not found or Expired",
    };
  }

  if (storedOtp !== code) {
    return { success: false, reason: "invalid", message: "Incorrect OTP" };
  }

  await redis.del(otpKey);

  return { success: true };
};

const isRateLimited = async (phone) => {
  const redis = await getRedis();

  const rateKey = `rate:${phone}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - RATE_LIMIT_WINDOW;
  const pipeline = redis.multi();

  pipeline.zRemRangeByScore(rateKey, 0, windowStart);

  pipeline.zAdd(rateKey, [{ score: now, value: now.toString() }]);

  pipeline.zCard(rateKey);

  pipeline.expire(rateKey, RATE_LIMIT_WINDOW);

  const [, , count] = await pipeline.exec();

  return count > MAX_REQUESTS;
};

module.exports = {
  saveOtp,
  verifyOtp,
  isRateLimited,
};
