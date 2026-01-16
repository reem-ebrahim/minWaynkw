
const router = require("express").Router();
const { endPoint } = require("../user/controler/user.endpoint");
const userservice =require("./streak.service")

router.get(
  "/streak",
  auth(endPoint.AllUser),
  userservice.getUserStreak
);

module.exports = router;
