const userRouter = require("./user/user.router");
const postRouter = require("./post/post.router");
const commentRouter = require("./comment/comment.router");
const bannerRouter = require("./banner/baner.router");
const notificationRouter = require("./notification/notification.router");
const countryRouter = require("./country/country.router");

module.exports = {
  userRouter,
  postRouter,
  commentRouter,
  bannerRouter,
  notificationRouter,
  countryRouter,
};
