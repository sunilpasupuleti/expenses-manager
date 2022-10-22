const httpstatus = require("http-status-codes");
const firebaseAdmin = require("firebase-admin");

module.exports = {
  VerifyToken: async (req, res, next) => {
    const headerToken = req.headers.authorization;
    if (!headerToken) {
      return res
        .status(httpstatus.FORBIDDEN)
        .json({ message: "No token provided to access" });
    }

    if (headerToken && headerToken.split(" ")[0] !== "Bearer") {
      return res
        .status(httpstatus.FORBIDDEN)
        .json({ message: "Invalid token", token: null });
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
        return res.status(httpstatus.UNAUTHORIZED).json({
          message: "Token has expired please login again",
          token: "false",
          err,
        });
      });
  },
};
