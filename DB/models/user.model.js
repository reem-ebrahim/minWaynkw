const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    nickName: String,

    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      unique: true, // إذا تبين كل رقم يكون فريد
      sparse: true, // يسمح بوجود null بدون ما يكسر unique
      trim: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: false, // خليها true إذا لازم وقت التسجيل
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
    pointer: {
      type: Number,
      default: 0,
    },
    vipLevel: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  console.log(this.password,'this.password')
  if(this.password){
 this.password = await bcrypt.hash(
    this.password,
    Number(process.env.SALTSOFROUND)
  );
  }
 
});
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() || {};
  const inc = update.$inc || {};
  const set = update.$set || {};

  // هذي الزيادة اللي جايه من الـ update (مثلاً +1)
  const incBad = inc.badWordsNumber || 0;

  if (incBad) {
    const current = await this.model
      .findOne(this.getQuery())
      .select("badWordsNumber __v");

    if (current) {
      // update __v
      this.set({ __v: current.__v + 1 });

      const newBad = (current.badWordsNumber || 0) + incBad;

      // ✅ إذا وصل 3 أو أكثر -> blocked
      if (newBad >= 3) {
        this.set({ blocked: true });
      }
    }
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
