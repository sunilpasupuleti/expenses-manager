const { cryptoDecrypt, sendResponse, httpCodes } = require("./utility");
const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const { SHA256 } = require("crypto-js");
const { plaidClient } = require("../config/plaidConfig");
const { getRedis } = require("../config/redisConfig");
const { firebaseAdmin } = require("../config/firebase");

module.exports = {
  VerifyToken: async (req, res, next) => {
    const headerToken = req.headers.authorization;
    if (!headerToken) {
      return sendResponse(res, httpCodes.FORBIDDEN, {
        message: "No token provided to access",
      });
    }

    if (headerToken && headerToken.split(" ")[0] !== "Bearer") {
      return sendResponse(res, httpCodes.FORBIDDEN, {
        message: "Invalid token",
        token: null,
      });
    }

    const token = headerToken.split(" ")[1];
    firebaseAdmin
      .auth()
      .verifyIdToken(token, true)
      .then(async (data) => {
        req.user = data;
        next();
      })
      .catch((err) => {
        console.error("Error in verifying token " + JSON.stringify(err));
        return sendResponse(res, httpCodes.UNAUTHORIZED, {
          message: "Token has expired please login again",
          token: "false",
          err,
        });
      });
  },

  VerifyPlaidWebhookSignature: async (req, res, next) => {
    try {
      const plaidSignature = req.headers["plaid-verification"];
      if (!plaidSignature) throw "No Plaid Signature";

      // Decoded Header
      const decodedHeader = JSON.parse(
        Buffer.from(plaidSignature.split(".")[0], "base64").toString("utf-8")
      );

      const kid = decodedHeader.kid;

      // check if key is cached
      const redisKey = `plaid:webhook-key:${kid}`;
      const redis = await getRedis();
      if (!redis) {
        throw "Redis client not initialized";
      }
      let jwk = await redis.get(redisKey);

      if (!jwk) {
        //Fetch key from plaid
        const { data } = await plaidClient.webhookVerificationKeyGet({
          key_id: kid,
        });
        jwk = data.key;
        await redis.set(redisKey, JSON.stringify(jwk), {
          EX: 60 * 60 * 24,
        });
      } else {
        jwk = JSON.parse(jwk);
      }

      // converrt jwk to PEM
      const pubKey = jwkToPem(jwk);
      const decoded = jwt.verify(plaidSignature, pubKey, {
        algorithms: ["ES256"],
        maxAge: "5m",
      });
      const hash = SHA256(req.rawBody).toString();

      if (hash !== decoded.request_body_sha256) {
        throw "Signature Validation Failed";
      }

      next();
    } catch (err) {
      console.log(err, "error");

      const errMessage = err.message || err.toString();
      console.warn("Plaid webhook verification failed:" + errMessage);
      if (global.io && req.query?.uid) {
        global.io.emit(`plaid_linked_${req.query.uid}`, {
          success: false,
          message: "Webhook signature verification failed! Try agian later",
          accessTokens: [],
        });
      }
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: errMessage,
      });
    }
  },

  VerifyAdminToken: async (req, res, next) => {
    if (!req.cookies || !req.cookies.refreshToken) {
      console.error("no refresh token and unauthorized");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "Unauthorized",
        refreshToken: null,
      });
    }

    if (
      (!req.cookies || !req.cookies.accessToken) &&
      req.cookies.refreshToken
    ) {
      console.error("unauthorized, there is no access token but refesh token");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "Unauthorized",
        accessToken: null,
      });
    }
    if (!req.cookies.accessToken) {
      console.error("unauthorized, there is no access token");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "Unauthorized",
      });
    }

    let token = req.cookies.accessToken;
    if (!token) {
      console.error("No token provided");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "No token provided to access the server",
      });
    }
    token = cryptoDecrypt(token);

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.expiredAt < new Date()) {
          return sendResponse(res, httpCodes.UNAUTHORIZED, {
            message:
              "Your security token had expired! Please login again to continue",
            accessToken: null,
          });
        }
        return sendResponse(res, httpCodes.UNAUTHORIZED, {
          message: "Jwt error " + err.message,
        });
      }
      let userData = decoded.data;
      req.user = userData;
      next();
    });
  },

  checkRole: (allowedRoles) => {
    return (req, res, next) => {
      let userData = req.user;
      let role = userData.role;
      if (allowedRoles.includes(role)) {
        console.info(`${role} role granted`);
        next();
      } else {
        return sendResponse(res, httpCodes.UNAUTHORIZED, {
          message: `Sorry! This route is protected and can be accessed only by ${allowedRoles.join(
            ","
          )}.`,
        });
      }
    };
  },
};
