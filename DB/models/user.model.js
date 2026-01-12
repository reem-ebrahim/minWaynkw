const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = mongoose.Schema(
  {
    fullName: String,
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profile_picture: String,
    confirmed: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false },
    badWordsNumber: { type: Number, default: 0 },
    role: { type: String, default: "user" },
    code: String,
    verificationCodeExpires: {
      type: Date,
    },
    numberOfReplies: {
      type: Number,
      default: 0,
    },
    numberOfPosts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(
    this.password,
    Number(process.env.SALTSOFROUND)
  );
});
userSchema.pre("findOneAndUpdate", async function (next) {
  const doc = await this.model.findOne(this.getQuery()).select("__v");

  if (doc) {
    this.set({ __v: doc.__v + 1 });
  }
  if (this.badWordsNumber >= 3) {
    this.blocked = true;
  }
});
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});
const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
