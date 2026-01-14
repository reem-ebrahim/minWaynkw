const { roles } = require("../../../Middleware/auth");

module.exports.endPoint = {
  AllUser: [roles.admin, roles.user, roles.super_admin, roles.vip],

  AdminAndSuperAdmin: [roles.super_admin, roles.vip, roles.admin],
  SuperAdmin: [roles.super_admin, roles.admin],
};
