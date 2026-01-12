const { roles } = require("../../../Middleware/auth");

module.exports.endPoint = {
   allUser:[roles.user,roles.admin]
}