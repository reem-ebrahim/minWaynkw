const UserStreakModel = require("../DB/models/streak.model");

function todayString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function dayDiff(prev, curr) {
  const p = new Date(prev + "T00:00:00.000Z").getTime();
  const c = new Date(curr + "T00:00:00.000Z").getTime();
  return Math.floor((c - p) / (24 * 60 * 60 * 1000));
}

function ensureDefaults() {
  return [
    { type: "likes", points: 0, message: "" },
    { type: "comments", points: 0, message: "" },
    { type: "dailyactivity", points: 0, message: "" },
  ];
}

function streakMiddleware(activityType, options = {}) {
  const { points = 0, message = "" } = options;

  return (req, res, next) => {
    res.on("finish", async () => {
      try {
        if (!req.user?.id) return;
        if (res.statusCode < 200 || res.statusCode >= 300) return;

        const userId = req.user.id;
        const today = todayString();
        const now = new Date();

        let streak = await UserStreakModel.findOne({ userId });
        const pointsRaw =
          res.locals?.points ??
          req.body?.points ??
          req.query?.points ??
          options.points ??
          0;
        // ✅ create if not exists
        if (!streak) {
          streak = await UserStreakModel.create({
            userId,
            lastActiveAt: null,
            lastDailyActivityDate: null,
            lastActivity: ensureDefaults(),
          });
        } else {
          // ✅ fix if lastActivity wrong
          const types = streak.lastActivity?.map((x) => x.type) || [];
          const mustFix =
            types.length !== 3 ||
            !types.includes("likes") ||
            !types.includes("comments") ||
            !types.includes("dailyactivity");

          if (mustFix) {
            await UserStreakModel.updateOne(
              { userId },
              { $set: { lastActivity: ensureDefaults() } }
            );
            streak.lastActivity = ensureDefaults();
          }
        }

        // =========================
        // 1) Update likes/comments by YOUR points
        // =========================
        if (activityType && pointsRaw !== 0) {
          await UserStreakModel.updateOne(
            { userId, "lastActivity.type": activityType },
            {
              $inc: { "lastActivity.$.points": pointsRaw },
              $set: {
                "lastActivity.$.message": message,
                "lastActivity.$.createdAt": now,
                lastActiveAt: now,
              },
            }
          );
        }

        // =========================
        // 2) Daily activity (once per day) + reset if missed day
        // =========================
        if (activityType == "dailyactivity" || activityType == "likes") {
          const lastDay = streak.lastDailyActivityDate; // may be null

          if (lastDay !== today) {
            // first activity today
            let diff = null;
            if (lastDay) diff = dayDiff(lastDay, today);

            if (lastDay && diff === 1) {
              // ✅ yesterday active => continue streak
              await UserStreakModel.updateOne(
                { userId, "lastActivity.type": "dailyactivity" },
                {
                  $inc: { "lastActivity.$.points": 1 }, // usually 1
                  $set: {
                    lastDailyActivityDate: today,
                    "lastActivity.$.message": "Daily activity",
                    "lastActivity.$.createdAt": now,
                    lastActiveAt: now,
                  },
                }
              );
            } else {
              await UserStreakModel.updateOne(
                { userId, "lastActivity.type": "dailyactivity" },
                {
                  $set: {
                    lastDailyActivityDate: today,
                    "lastActivity.$.points": 1,
                    "lastActivity.$.message": "Daily activity",
                    "lastActivity.$.createdAt": now,
                    lastActiveAt: now,
                  },
                }
              );
            }
          } else {
            // same day: just update lastActiveAt
            await UserStreakModel.updateOne(
              { userId },
              { $set: { lastActiveAt: now } }
            );
          }
        }
      } catch (e) {
        console.log("streakMiddleware error:", e.message);
      }
    });

    next();
  };
}

module.exports = { streakMiddleware };
