const jwt = require("jsonwebtoken");
const userModel = require("../DB/models/user.model");
require("dotenv").config();

module.exports.roles = {
  admin: "admin",
  user: "user",
  super_admin: "super_admin",
  vip: "vip",
};

module.exports.auth = (accessRoles = []) => {
  return async (req, res, next) => {
    try {
      const headerToken = req.headers.authorization;

      // ✅ check header
      if (!headerToken || !headerToken.startsWith(`${process.env.BEARER} `)) {
        return res.error("Invalid authorization header", null, 401);
      }

      const token = headerToken.split(" ")[1];
      if (!token) {
        return res.error("Token not provided", null, 401);
      }

      // ✅ verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.jwtauth);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res.error("Token expired, please login again", null, 401);
        }
        return res.error("Invalid token", null, 401);
      }

      // ✅ get user
      const user = await userModel.findById(decoded.id).select("role blocked");
      if (!user) {
        return res.error("User not found", null, 404);
      }

      // ✅ blocked check
      if (user.blocked) {
        return res.error("Your account is blocked", null, 403);
      }

      // ✅ role check
      if (accessRoles.length && !accessRoles.includes(user.role)) {
        return res.error("You are not authorized to access this resource", null, 403);
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.error("Authentication error", error.message, 500);
    }
  };
};
