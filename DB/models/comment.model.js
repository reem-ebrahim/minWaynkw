const mongoose = require("mongoose");
const userModel = require("./user.model");
const commentSchema = mongoose.Schema({
  body: String,
  comment_by: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  post_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "comment" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
});
// commentSchema.post("save", async function (doc) {

//   await userModel.findByIdAndUpdate(doc.comment_by, {
//     $inc: { numberOfReplies: 1 },
//   });
// });

// commentSchema.post("findOneAndDelete", async function (doc) {
//   if (!doc) return;

//   await userModel.findByIdAndUpdate(
//     doc.createdBy,
//     { $inc: { numberOfReplies: -1 } }
//   );
// });
const commentModel = mongoose.model("comment", commentSchema);

module.exports = commentModel;
