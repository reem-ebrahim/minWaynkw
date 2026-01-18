const { auth } = require("../../Middleware/auth");
const { streakMiddleware } = require("../../Middleware/streak.middleware");
const { validate } = require("../../Middleware/validation");
const { myMulter, filetype } = require("../../services/multer");
const { endPoint } = require("./controler/post.endpoint");
const postService = require("./controler/post.service");
const validationPost = require("./controler/post.validation");
const router = require("express").Router();

router.post(
  "/",
  auth(endPoint.allUser),
  myMulter("posts", [...filetype.Image, ...filetype.Video]).fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 3 },
  ]),
  
  validate(validationPost.createPost),
  postService.createPost
);
router.get("/", auth(endPoint.allUser), postService.getAllPosts);
router.patch(
  "/:id/like",
  auth(endPoint.allUser),
  postService.likeAndUnlikePost
);
router.delete(
  "/:id",
  auth(endPoint.allUser),
  validate(validationPost.deletePost),
  postService.deletePost
);
router.get("/home", postService.getAllPostsAndBanners);

module.exports = router;
