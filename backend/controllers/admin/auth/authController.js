const {
  getJwt,
  cryptoEncrypt,
  sendResponse,
  httpCodes,
  cryptoDecrypt,
  adminRole,
} = require("../../../helpers/utility");
const jwt = require("jsonwebtoken");
const Users = require("../../../models/Users");
const logger = require("../../../middleware/logger/logger");
const { lowercase } = require("../../../helpers/typography");

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  path: "/",
};

const returnLoginCookies = (data, res) => {
  let accessToken = getJwt(data, "1h");
  accessToken = cryptoEncrypt(accessToken);
  let refreshToken = getJwt(data, "30d");
  refreshToken = cryptoEncrypt(refreshToken);

  var accessTokenmaxAge = 1 * 60 * 60 * 1000;
  var refreshTokenmaxAge = 30 * 24 * 60 * 60 * 1000;
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: accessTokenmaxAge,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: refreshTokenmaxAge,
  });
};

module.exports = {
  async getSelfUser(req, res) {
    const data = await Users.findOne({
      _id: req.user._id,
      role: adminRole,
    });

    return sendResponse(res, httpCodes.OK, {
      message: "User Details",
      userData: data,
    });
  },

  async refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      logger.error("No refresh token provided");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "No refresh token provided to send the access token",
      });
    }

    let refreshTokenCryptoDecrypted = cryptoDecrypt(refreshToken);
    return jwt.verify(
      refreshTokenCryptoDecrypted,
      process.env.JWT_SECRET,
      async (err, decoded) => {
        if (err) {
          if (err.expiredAt < new Date()) {
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            logger.error("Refresh token expired");

            return sendResponse(res, httpCodes.UNAUTHORIZED, {
              message:
                "Your refresh token had expired! Please login again to continue",
              refreshToken: null,
            });
          }
          logger.error(err.message, " Error in refresh token function call");
          return sendResponse(res, httpCodes.UNAUTHORIZED, {
            message: "Refresh token error" + err.stack,
            refreshToken: null,
          });
        }
        let decodedData = decoded.data;

        let userData = await Users.findOne({ _id: decodedData._id });
        if (userData) {
          let accessToken = getJwt(userData, "1h");
          accessToken = cryptoEncrypt(accessToken);
          var accessTokenmaxAge = 1 * 60 * 60 * 1000;

          res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: accessTokenmaxAge,
          });

          return sendResponse(res, httpCodes.OK, {
            message: "access token received",
          });
        } else {
          return sendResponse(res, httpCodes.UNAUTHORIZED, {
            message: "No user found  ",
            result: false,
          });
        }
      }
    );
  },

  async signin(req, res) {
    const { email, password } = req.body;
    let signInData;
    var userData = await Users.findOne({
      email: lowercase(email),
      role: adminRole,
      password: password,
    });
    if (!userData) {
      return sendResponse(res, httpCodes.NOT_FOUND, {
        message: "Invalid Email / Password",
      });
    } else {
      signInData = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      };
      returnLoginCookies(signInData, res);
      return sendResponse(res, httpCodes.OK, {
        message: "Login successfull",
        userData: signInData,
      });
    }
  },

  async signout(req, res) {
    try {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return sendResponse(res, httpCodes.OK, { message: "logged out" });
    } catch (e) {
      logger.info("err", e);
    }
  },
};
