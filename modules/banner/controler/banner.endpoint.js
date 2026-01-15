const { roles } = require("../../../Middleware/auth");

module.exports.endpoint = {
    AllUser: [roles.admin, roles.user,roles.super_admin,roles.vip],
    managerUser:[roles.admin,roles.super_admin,roles.vip]
}