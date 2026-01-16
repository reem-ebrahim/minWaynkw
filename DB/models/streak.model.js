const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["post", "comment", "reply", "like"],
      required: true,
    },
    refModel: {
      type: String,
    enum: ["post", "comment"], 
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      refPath: "recentActivities.refModel",
    },

    message: {
      type: String, // مثال: "You commented on a post"
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userStreakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      unique: true,
      required: true,
    },

    // ===== STREAK =====
    lastActiveDate: { type: String, default: null },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },

    // ===== TOTAL COUNTERS =====
    totalPosts: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalReplies: { type: Number, default: 0 },

    // ===== RECENT ACTIVITY =====
    recentActivities: {
      type: [activitySchema],
      default: [],
      maxlength: 50, // نخلي آخر 50 Activity بس
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserStreak", userStreakSchema);
