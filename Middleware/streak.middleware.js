const { recordActivity } = require("../modules/streak/streak.service");

const streakMiddleware = (type, meta = {}) => {
  return (req, res, next) => {
    if (!req.user?._id) return next();

    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await recordActivity(req.user._id, type, {
          ...meta,
          refId: res.locals?.createdId,
        });
      }
    });

    next();
  };
};

module.exports = { streakMiddleware };
