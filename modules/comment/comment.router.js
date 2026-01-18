const { auth } = require("../../Middleware/auth");
const { streakMiddleware } = require("../../Middleware/streak.middleware");
const { validate } = require("../../Middleware/validation");
const { endpoint } = require("./controler/comment.endpoint");
const commentservice = require("./controler/comment.service");
const validatecomment = require("./controler/comment.valid");

const router = require("express").Router();
router.post(
  "/addcomment/:id",
  auth(endpoint.AllUser),
  streakMiddleware("dailyactivity"),

  validate(validatecomment.validationsddcomment),
  commentservice.addcomment
);
router.post(
  "/addreply",
  auth(endpoint.AllUser),
  streakMiddleware("dailyactivity"),

  validate(validatecomment.validationsreplycomment),
  commentservice.addreplycomment
);
router.patch(
  "/:id",
  auth(endpoint.AllUser),
  validate(validatecomment.validationsupdatecomment),
  commentservice.updatecomment
);
router.delete(
  "/:id",
  auth(endpoint.AllUser),
  streakMiddleware("dailyactivity"),

  validate(validatecomment.validationsdeletecomment),
  commentservice.deletecomment
);
router.patch(
  "/:id/like",
  auth(endpoint.AllUser),
  streakMiddleware("likes", { message: "likes add to comment" }),

  validate(validatecomment.validationslikecomment),
  commentservice.likeandunlikecomment
);

module.exports = router;
