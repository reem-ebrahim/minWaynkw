const joi = require("joi");
const objectId = joi.string().hex().length(24);
module.exports.signupvalidation = {
  body: joi
    .object({
      firstName: joi.string().min(3).max(30).required().messages({
        "string.empty": "first name is required",
        "string.min": "first name must be at least 3 characters",
        "any.required": "first name is required",
      }),

      lastName: joi.string().min(3).max(30).required().messages({
        "string.empty": "last name is required",
        "string.min": "last name must be at least 3 characters",
        "any.required": "last name is required",
      }),

      email: joi.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Email must be a valid email",
        "any.required": "Email is required",
      }),

      phoneNumber: joi
        .string()
        .pattern(/^\+\d{8,15}$/)
        .required()
        .messages({
          "string.empty": "Phone number is required",
          "string.pattern.base":
            "Phone number must be in international format (e.g. +965XXXXXXXX)",
          "any.required": "Phone number is required",
        }),

      country: objectId.required().messages({
        "string.length": "Invalid country id",
        "string.hex": "Invalid country id",
        "any.required": "Country is required",
      }),

      password: joi.string().min(8).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 8 characters",
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
      firstName: joi.string().min(3).max(30).messages({
        "string.empty": "firstName is required",
        "string.min": "firstName must be at least 3 characters",
      }),
      lastName: joi.string().min(3).max(30).messages({
        "string.empty": "lastName is required",
        "string.min": "lastName must be at least 3 characters",
      }),
      nickName: joi.string().min(3).max(30).messages({
        "string.empty": "nickName is required",
        "string.min": "nickName must be at least 3 characters",
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
        .length(4)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
          "string.empty": "Verification code is required",
          "string.length": "Verification code must be 4 digits",
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

module.exports.assignVipValidation = {
  params: joi
    .object()
    .required()
    .keys({
      id: objectId.required().messages({
        "string.length": "Invalid user id",
        "string.hex": "Invalid user id",
        "any.required": "User id is required",
      }),
    }),

  body: joi
    .object()
    .required()
    .keys({
      vipLevel: joi.number().integer().min(1).max(100).required().messages({
        "number.base": "vipLevel must be a number",
        "number.integer": "vipLevel must be an integer",
        "number.min": "vipLevel must be at least 1",
        "number.max": "vipLevel must be at most 100",
        "any.required": "vipLevel is required",
      }),
    }),
};
