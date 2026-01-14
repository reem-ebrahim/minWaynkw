const Joi = require("joi");

module.exports.createBannerSchema = {
  body: Joi.object({
    tap: Joi.string().min(2).max(100).required(),
    link: Joi.string()
      .uri()
      .required(),
    startDate: Joi.date().optional(),
    endDate: Joi.date()
      .greater(Joi.ref("startDate"))
      .optional(),
  }),
};

module.exports.deleteBannerSchema = {
  params: Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  }),
};

module.exports.updateBannerSchema = {
  params: Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  }),
  body: Joi.object({
    tap: Joi.string().min(2).max(100).optional(),
    link: Joi.string().uri().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().greater(Joi.ref("startDate")).optional(),
  }).min(1), // 🔥 must send at least one field
};