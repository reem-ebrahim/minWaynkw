const bannerModel = require("../../../DB/models/banner.model");
const notificationModel = require("../../../DB/models/notification.model");
const userModel = require("../../../DB/models/user.model");

/* ================= CREATE BANNER ================= */
module.exports.createBanner = async (req, res) => {
  try {
    const { tap, link, startDate, endDate } = req.body;

    const user = await userModel.findById(req.user.id);
    if (!user) return res.error("User not found", null, 404);
    if (req.imagevalidtype) {
      return res.error("Invalid image type", null, 400);
    }

    if (!req.file) {
      return res.error("Banner image is required", null, 400);
    }

    // ✅ Save image path as a link
    const image = `${req.destination}/${req.file.filename}`;
    const banner = await bannerModel.create({
      tap,
      image,
      link,
      startDate,
      endDate,
      createdBy: user._id,
    });
    const users = await userModel.find({
      _id: { $ne: req.user.id },
      role: "user",
    });

    const notifications = users.map((u) => ({
      title: "New Banner",
      message: "A new banner has been added",
      type: "banner",
      receiver: u._id,
      sender: req.user.id,
      relatedId: banner._id,
    }));

    await notificationModel.insertMany(notifications);

    return res.success("Banner created successfully", banner, 201);
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

/* ================= GET ALL BANNERS ================= */
module.exports.getAllBanners = async (req, res) => {
  try {
    const now = new Date();

    const banners = await bannerModel
      .find({
        startDate: { $lte: now },
        $or: [{ endDate: null }, { endDate: { $gte: now } }],
      })
      .sort({ createdAt: -1 })
      .populate({
        path: "createdBy",
        select: "firstName lastName email profile_picture country",
        populate: {
          path: "country",
          select: "name isoCode dialCode flag",
        },
      });

    return res.success("Banners fetched successfully", banners);
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

module.exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await bannerModel.findById(id);
    if (!banner) return res.error("Banner not found", null, 404);

    if (banner.createdBy.toString() !== req.user.id) {
      return res.error("Not authorized", null, 403);
    }

    // image update (optional)
    if (req.file) {
      banner.image = `${req.destination}/${req.file.filename}`;
    }

    // text fields update
    if (req.body.tap) banner.tap = req.body.tap;
    if (req.body.link) banner.link = req.body.link;
    if (req.body.startDate) banner.startDate = req.body.startDate;
    if (req.body.endDate) banner.endDate = req.body.endDate;

    await banner.save();

    return res.success("Banner updated successfully", banner);
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

/* ================= DELETE BANNER ================= */
module.exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await bannerModel.findById(id);
    if (!banner) return res.error("Banner not found", null, 404);

    // only creator or admin
    if (banner.createdBy.toString() !== req.user.id) {
      return res.error("Not authorized", null, 403);
    }

    await bannerModel.findByIdAndDelete(id);

    return res.success("Banner deleted successfully");
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

/* ================= TAP / CLICK BANNER ================= */
module.exports.tapBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await bannerModel.findById(id);
    if (!banner) return res.error("Banner not found", null, 404);

    return res.success("Banner tapped successfully", {
      link: banner.link,
    });
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};
