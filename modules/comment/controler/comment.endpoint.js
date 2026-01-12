const { roles } = require("../../../Middleware/auth");

module.exports.endpoint = {
    AllUser: [roles.admin, roles.user]
}