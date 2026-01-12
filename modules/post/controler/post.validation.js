const joi = require("joi");

module.exports.createPost = {
  body: joi
    .object()
    .required()
    .keys({
      text: joi.string().min(3).max(150).required().messages({
        "string.empty": "text is required",
        "string.min": "text must be at least 3 characters",
        "any.required": "text is required",
      }),
    }),
};

module.exports.deletePost = {
  params: joi.object({
    id: joi.string()
      .hex()
      .length(24)
      .required(),
  }),
};