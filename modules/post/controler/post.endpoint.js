const { roles } = require("../../../Middleware/auth");

module.exports.endPoint = {
   allUser:[roles.admin, roles.user,roles.super_admin,roles.vip]
}