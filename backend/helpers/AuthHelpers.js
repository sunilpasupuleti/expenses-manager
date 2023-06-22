const firebaseAdmin = require("firebase-admin");
const { cryptoDecrypt, sendResponse, httpCodes } = require("./utility");
const logger = require("../middleware/logger/logger");
const jwt = require("jsonwebtoken");

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
        logger.error("Error in verifying token " + JSON.stringify(err));
        return sendResponse(res, httpCodes.UNAUTHORIZED, {
          message: "Token has expired please login again",
          token: "false",
          err,
        });
      });
  },

  VerifyAdminToken: async (req, res, next) => {
    if (!req.cookies || !req.cookies.refreshToken) {
      logger.error("no refresh token and unauthorized");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "Unauthorized",
        refreshToken: null,
      });
    }

    if (
      (!req.cookies || !req.cookies.accessToken) &&
      req.cookies.refreshToken
    ) {
      logger.error("unauthorized, there is no access token but refesh token");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "Unauthorized",
        accessToken: null,
      });
    }
    if (!req.cookies.accessToken) {
      logger.error("unauthorized, there is no access token");
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
        logger.info(`${role} role granted`);
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
