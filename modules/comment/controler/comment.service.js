const commentModel = require("../../../DB/models/comment.model");
const postModel = require("../../../DB/models/post.model");
const userModel = require("../../../DB/models/user.model");

/* ================= ADD COMMENT ================= */
module.exports.addcomment = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const { body } = req.body;

    const user = await userModel.findById(req.user.id);
    if (!user) return res.error("User not found", null, 404);

    const post = await postModel.findById(id);
    if (!post) return res.error("Post not found", null, 404);

    const comment = await commentModel.create({
      body,
      comment_by: [user._id],
      post_id: [post._id],
    });
    post.comments.push(comment._id);
    await post.save();
    return res.success("Comment added successfully", comment, 201);
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

/* ================= ADD REPLY ================= */
module.exports.addreplycomment = async (req, res) => {
  try {
    const { commentId } = req.query;
    const { body } = req.body;

    const user = await userModel.findById(req.user.id);
    if (!user) return res.error("User not found", null, 404);

    const parentComment = await commentModel.findById(commentId);
    if (!parentComment) return res.error("Comment not found", null, 404);

    const reply = await commentModel.create({
      body,
      comment_by: [user._id],
      post_id: parentComment.post_id,
    });

    await commentModel.findByIdAndUpdate(parentComment._id, {
      $push: { replies: reply._id },
    });

    return res.success("Reply added successfully", reply, 201);
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

/* ================= UPDATE COMMENT ================= */
module.exports.updatecomment = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    const userId = req.user.id;

    const comment = await commentModel.findById(id);
    if (!comment) return res.error("Comment not found", null, 404);

    if (!comment.comment_by.includes(userId)) {
      return res.error("Not authorized", null, 403);
    }

    comment.body = body;
    await comment.save();

    return res.success("Comment updated successfully", comment);
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

/* ================= DELETE COMMENT ================= */
module.exports.deletecomment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await commentModel.findById(id);
    if (!comment) return res.error("Comment not found", null, 404);

    if (!comment.comment_by.includes(userId)) {
      return res.error("Not authorized", null, 403);
    }

    /* 🔥 DELETE ALL REPLIES */
    if (comment.replies.length > 0) {
      await commentModel.deleteMany({
        _id: { $in: comment.replies },
      });
    }

    /* 🔥 DELETE COMMENT */
    await commentModel.findByIdAndDelete(id);

    /* 🔥 REMOVE COMMENT FROM POST */
    await postModel.updateMany({ comments: id }, { $pull: { comments: id } });

    return res.success("Comment and replies deleted successfully");
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};


module.exports.likeandunlikecomment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await commentModel.findById(id);
    if (!comment) return res.error("Comment not found", null, 404);

    const isLiked = comment.likes.some(
      (like) => like.toString() === userId.toString()
    );

    const update = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedComment = await commentModel
      .findByIdAndUpdate(id, update, { new: true })
      .populate("comment_by", "firstName lastName email");

    return res.success(isLiked ? "Comment unliked" : "Comment liked", {
      comment: updatedComment,
      likesCount: updatedComment.likes.length,
      likedByUser: !isLiked,
    });
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};
