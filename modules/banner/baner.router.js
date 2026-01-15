const { auth, roles } = require("../../Middleware/auth");
const { validate } = require("../../Middleware/validation");
const { myMulter, filetype } = require("../../services/multer");
const { endpoint } = require("./controler/banner.endpoint");
const bannerService = require("./controler/banner.service");
const bannerValid = require("./controler/banner.valid");

const router = require("express").Router();

router.get("/", bannerService.getAllBanners);
router.post(
  "/",
  auth(endpoint.managerUser),
  myMulter("banner", filetype.Image).single("image"),
  validate(bannerValid.createBannerSchema),
  bannerService.createBanner
);
router.delete(
  "/:id",
  auth(endpoint.managerUser),
  validate(bannerValid.deleteBannerSchema),
  bannerService.deleteBanner
);

router.patch(
  "/:id",
  auth(endpoint.managerUser),
  myMulter("banner", filetype.Image).single("image"),
  validate(bannerValid.updateBannerSchema),
  bannerService.updateBanner
);
module.exports = router;
