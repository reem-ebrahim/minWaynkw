const { auth } = require("../../Middleware/auth");
const { validate } = require("../../Middleware/validation");
const { endpoint } = require("./controler/comment.endpoint");
const commentservice = require("./controler/comment.service");
const validatecomment = require("./controler/comment.valid");

const router = require("express").Router();
router.post(
  "/addcomment/:id",
  auth(endpoint.AllUser),
  validate(validatecomment.validationsddcomment),
  commentservice.addcomment
);
router.post(
  "/addreply",
  auth(endpoint.AllUser),
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
  validate(validatecomment.validationsdeletecomment),
  commentservice.deletecomment
);
router.patch(
  "/:id/like",
  auth(endpoint.AllUser),
  validate(validatecomment.validationslikecomment),
  commentservice.likeandunlikecomment
);

module.exports = router;
