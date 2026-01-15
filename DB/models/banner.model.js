const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    tap: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String, // image URL or path
      required: true,
    },

    link: {
      type: String, // where user goes on tap/click
      required: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Banner", bannerSchema);
