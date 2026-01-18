const UserStreakModel = require("../DB/models/streak.model");


const ONE_WEEK = 1 * 24 * 60 * 60 * 1000;

function streakMiddleware(activityType, options = {}) {
  const { message = "", points = 1 } = options;

  return async (req, res, next) => {
    try {
      // if user not logged in, skip
      if (!req.user?.id) return next();

      const userId = req.user.id;

      // ✅ ensure document exists with fixed 3 activities
      let streak = await UserStreakModel.findOne({ userId });

      if (!streak) {
        streak = await UserStreakModel.create({
          userId,
          lastActiveAt: null,
          lastActivity: [
            { type: "likes", points: 0, message: "" },
            { type: "comments", points: 0, message: "" },
            { type: "dailyactivity", points: 0, message: "" },
          ],
        });
      } else {
        // ✅ if doc exists but array missing/incorrect -> fix it once
        const types = streak.lastActivity?.map((x) => x.type) || [];
        const mustFix =
          types.length !== 3 ||
          !types.includes("likes") ||
          !types.includes("comments") ||
          !types.includes("dailyactivity");

        if (mustFix) {
          await UserStreakModel.updateOne(
            { userId },
            {
              $set: {
                lastActivity: [
                  { type: "likes", points: 0, message: "" },
                  { type: "comments", points: 0, message: "" },
                  { type: "dailyactivity", points: 0, message: "" },
                ],
              },
            }
          );
        }
      }

      // ✅ reset if inactive 7 days
      if (streak?.lastActiveAt) {
        const diff = Date.now() - new Date(streak.lastActiveAt).getTime();
        if (diff >= ONE_WEEK) {
          await UserStreakModel.updateOne(
            { userId },
            {
              $set: {
                "lastActivity.$[].points": 0,
                "lastActivity.$[].message": "",
              },
            }
          );
        }
      }

      // ✅ update ONLY the selected type (no push / no increase array)
      await UserStreakModel.updateOne(
        { userId, "lastActivity.type": activityType },
        {
          $inc: { "lastActivity.$.points": points },
          $set: {
            "lastActivity.$.message": message,
            "lastActivity.$.createdAt": new Date(),
            lastActiveAt: new Date(),
          },
        }
      );

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { streakMiddleware };
