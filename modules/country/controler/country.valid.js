const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

module.exports.createCountrySchema = {
  body: Joi.object({
    name: Joi.string().required(),

    isoCode: Joi.string().uppercase().required(),

    dialCode: Joi.string().required(),

    flag: Joi.string().uri().required(),
  }),
};
module.exports.updateCountrySchema = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    dialCode: Joi.string().optional(),

    flag: Joi.string().uri().optional(),
  }).min(1),
};

module.exports.deleteCountrySchema = {
  params: Joi.object({
    id: objectId.required(),
  }),
};
