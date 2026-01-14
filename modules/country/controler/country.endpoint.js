const { roles } = require("../../../Middleware/auth");

module.exports.endpoint = {
    AllUser: [roles.admin, roles.user, roles.super_admin,roles.vip],
    adminAndsuper_admin:[roles.admin,roles.super_admin],
    super_admin:[roles.super_admin],
    

}