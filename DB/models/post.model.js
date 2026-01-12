const mongoose = require("mongoose");
const userModel = require("./user.model");
const postSchema = mongoose.Schema(
  {
    text: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    hidden: { type: Boolean, default: "false" },
    isDeleted: { type: Boolean, default: "false" },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "comment" }],
    images: [String],
    videos: [String],
  },
  {
    timestamps: true,
  }
);
postSchema.pre("findOneAndUpdate", async function (next) {
  const version = await this.model.findOne(this.getQuery()).select("__v");
  this.set({ __v: version.__v + 1 });
});
postSchema.post("save", async function (doc) {
  await userModel.findByIdAndUpdate(doc.createdBy, {
    $inc: { numberOfPosts: 1 },
  });
});

postSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  await userModel.findByIdAndUpdate(
    doc.createdBy,
    { $inc: { numberOfPosts: -1 } }
  );
});
const postModel = mongoose.model("post", postSchema);
module.exports = postModel;
