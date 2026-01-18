const mongoose = require("mongoose");

const lastActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["likes", "comments", "dailyactivity"],
      required: true,
    },
    points: { type: Number, default: 0 },
    message: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
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

    lastActiveAt: { type: Date, default: null },

    // ✅ نحتاجه عشان dailyactivity يزيد مرة واحدة يوميًا + نعرف لو في يوم فات بدون نشاط
    lastDailyActivityDate: { type: String, default: null }, // "YYYY-MM-DD"

    lastActivity: {
      type: [lastActivitySchema],
      default: [
        { type: "likes", points: 0, message: "" },
        { type: "comments", points: 0, message: "" },
        { type: "dailyactivity", points: 0, message: "" },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserStreak", userStreakSchema);
