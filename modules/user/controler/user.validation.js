const joi = require("joi");

module.exports.signupvalidation = {
  body: joi
    .object({
      fullName: joi.string().min(3).max(30).required().messages({
        "string.empty": "Full name is required",
        "string.min": "Full name must be at least 3 characters",
        "any.required": "Full name is required",
      }),

      email: joi.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Email must be a valid email",
        "any.required": "Email is required",
      }),

      password: joi.string().min(8).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters",
        "any.required": "Password is required",
      }),

      cPassword: joi.string().valid(joi.ref("password")).required().messages({
        "any.only": "Confirm password must match password",
        "any.required": "Confirm password is required",
      }),
    })
    .required(),
};

module.exports.confirmvalidation = {
  params: joi.object().required().keys({
    token: joi.string().required(),
  }),
};
module.exports.signinvalidation = {
  body: joi
    .object()
    .required()
    .keys({
      email: joi.string().email().required(),
      password: joi.string().min(8).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters",
        "any.required": "Password is required",
      }),
    }),
};
module.exports.profilevalidation = {
  body: joi
    .object()
    .required()
    .keys({
      email: joi.string().email(),
      fullName: joi.string().min(3).max(30).messages({
        "string.empty": "fullName is required",
        "string.min": "fullName must be at least 3 characters",
      }),
    }),
};
module.exports.deletevalidation = {
  params: joi.object().required().keys({
    id: joi.string().required(),
  }),
};
module.exports.sendVerifyvalid = {
  body: joi.object().required().keys({
    email: joi.string().email().required(),
  }),
};
module.exports.forgetPassword = {
  body: joi
    .object()
    .required()
    .keys({
      email: joi.string().email().required(),
      newPassword: joi.string().min(8).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters",
        "any.required": "Password is required",
      }),
    }),
};
module.exports.softDeletevalid = {
  params: joi.object().required().keys({
    id: joi.string().required(),
  }),
};

module.exports.changePassword = {
  body: joi
    .object()
    .required()
    .keys({
      oldPassword: joi.string().required().messages({
        "string.empty": "Old password is required",
        "any.required": "Old password is required",
      }),

      newPassword: joi.string().min(8).required().messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 8 characters",
        "any.required": "New password is required",
      }),
    }),
};

module.exports.confirmByCode = {
  body: joi
    .object()
    .required()
    .keys({
      email: joi.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Email must be a valid email",
        "any.required": "Email is required",
      }),

      code: joi
        .string()
        .length(6)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
          "string.empty": "Verification code is required",
          "string.length": "Verification code must be 6 digits",
          "string.pattern.base": "Verification code must contain only numbers",
          "any.required": "Verification code is required",
        }),
    }),
};

module.exports.resendCode = {
  body: joi
    .object()
    .required()
    .keys({
      email: joi.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Email must be a valid email",
        "any.required": "Email is required",
      }),
    }),
};

module.exports.resetPasswordByCode = {
  body: joi
    .object()
    .required()
    .keys({
      email: joi.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Email must be a valid email",
        "any.required": "Email is required",
      }),

      code: joi
        .string()
        .length(6)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
          "string.empty": "Verification code is required",
          "string.length": "Verification code must be 6 digits",
          "string.pattern.base": "Verification code must contain only numbers",
          "any.required": "Verification code is required",
        }),

      newPassword: joi.string().min(8).required().messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 8 characters",
        "any.required": "New password is required",
      }),
    }),
};
