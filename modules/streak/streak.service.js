const UserStreak = require("../../DB/models/streak.model");

// Cairo date string YYYY-MM-DD
function getCairoDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

function diffDays(dateStrA, dateStrB) {
  // dateStr: YYYY-MM-DD
  const [yA, mA, dA] = dateStrA.split("-").map(Number);
  const [yB, mB, dB] = dateStrB.split("-").map(Number);

  const a = new Date(Date.UTC(yA, mA - 1, dA));
  const b = new Date(Date.UTC(yB, mB - 1, dB));
  const ms = a.getTime() - b.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

async function recordActivity(userId, type, options = {}) {
  const today = getCairoDateString();

  let streak = await UserStreak.findOne({ userId });
  if (!streak) streak = await UserStreak.create({ userId });

  // counters
  if (type === "post") streak.totalPosts += 1;
  if (type === "comment") streak.totalComments += 1;
  if (type === "reply") streak.totalReplies += 1;

  // ===== ADD RECENT ACTIVITY =====
  streak.recentActivities.unshift({
    type,
    refId: options.refId,
    refModel: options.refModel,
    message: options.message,
  });

  // keep only last 50
  streak.recentActivities = streak.recentActivities.slice(0, 50);

  // ===== STREAK LOGIC =====
  if (!streak.lastActiveDate) {
    streak.lastActiveDate = today;
    streak.currentStreak = 1;
  } else if (streak.lastActiveDate !== today) {
    const diff = diffDays(today, streak.lastActiveDate);
    streak.currentStreak = diff === 1 ? streak.currentStreak + 1 : 1;
    streak.lastActiveDate = today;
  }

  streak.bestStreak = Math.max(streak.bestStreak, streak.currentStreak);

  await streak.save();
}

const getUserStreak = async (req, res) => {
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
        select: "text images videos createdBy comment_by postId",
      });

    const safe = streak || {
      userId: req.user._id,
      lastActiveDate: null,
      currentStreak: 0,
      bestStreak: 0,
      totalPosts: 0,
      totalComments: 0,
      totalReplies: 0,
      recentActivities: [],
    };
    return res.success("Streak fetched successfully", safe);
  } catch {
    return res.error("Internal server error", error.message, 500);
  }
};

module.exports = { recordActivity, getUserStreak };
