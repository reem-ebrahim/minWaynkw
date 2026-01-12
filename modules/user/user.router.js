const { auth } = require("../../Middleware/auth");
const { validate } = require("../../Middleware/validation");
const { myMulter, filetype } = require("../../services/multer");
const { endPoint } = require("./controler/user.endpoint");
const userservice = require("./controler/user.service");
const validationuser = require("./controler/user.validation");
const router = require("express").Router();
router.post(
  "/signup",
  validate(validationuser.signupvalidation),
  userservice.signup
);
router.get(
  "/confirmEmail/:token",
  validate(validationuser.confirmvalidation),
  userservice.confirm
);
router.post(
  "/signin",
  validate(validationuser.signinvalidation),
  userservice.signin
);
router.patch(
  "/updateProfile",
  auth(endPoint.updateProfile),
  myMulter("picture", filetype.Image).single("image"),
  validate(validationuser.profilevalidation),
  userservice.profile
);
router.delete(
  "/deleteUser/:id",
  auth(endPoint.deleteUser),
  validate(validationuser.deletevalidation),
  userservice.profiledelete
);

router.post(
  "/sendVerifyEmail",
  validate(validationuser.sendVerifyvalid),
  userservice.sendVerifyEmail
);
router.post(
  "/forgetPassword",
  validate(validationuser.forgetPassword),
  userservice.forgetpassword
);
router.post(
  "/changePassword",
  auth(endPoint.updateProfile),

  validate(validationuser.changePassword),
  userservice.changePassword
);
router.get("/me", auth(endPoint.updateProfile), userservice.getUserByToken);

router.post(
  "/confirm-code",
  validate(validationuser.confirmByCode),
  userservice.confirmByCode
);

router.post(
  "/resend-code",
  validate(validationuser.resendCode),
  userservice.sendVerifyEmail
);

module.exports = router;
