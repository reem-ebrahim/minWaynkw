const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

module.exports.createAdminNotificationSchema = {
  body: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    message: Joi.string().min(5).required(),
    receiver: objectId.required(),
  }),
};

module.exports.notificationIdSchema = {
  params: Joi.object({
    id: objectId.required(),
  }),
};
