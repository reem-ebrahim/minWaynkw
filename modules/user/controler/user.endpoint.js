const { roles } = require("../../../Middleware/auth");

module.exports.endPoint = {
    deleteUser: [roles.admin, roles.user],
    updateProfile: [roles.admin, roles.user],
    updatePicture: [roles.admin, roles.user],
    softdelet:  [roles.admin, roles.user]
}