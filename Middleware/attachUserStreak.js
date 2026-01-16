const UserStreak = require("../DB/models/streak.model");

const attachUserStreak = async (req, res, next) => {
  try {
    const streak = await UserStreak.findOne({ userId: req.user._id })
      .populate({
        path: "userId",
        select: "firstName lastName email profile_picture country",
        populate: {
          path: "country",
          select: "name isoCode dialCode flag",
        },
      })
      .populate({
        path: "recentActivities.refId",
        select: "text images videos createdBy  postId firstName lastName email profile_picture country body",
      });
    // attach to request (DO NOT send response here)
    req.userStreak = streak || {
      lastActiveDate: null,
      currentStreak: 0,
      bestStreak: 0,
      totalPosts: 0,
      totalComments: 0,
      totalReplies: 0,
      recentActivities: [],
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { attachUserStreak };
