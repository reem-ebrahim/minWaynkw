const commentModel = require("../../../DB/models/comment.model");
const notificationModel = require("../../../DB/models/notification.model");
const postModel = require("../../../DB/models/post.model");
const userModel = require("../../../DB/models/user.model");
const UserStreakModel = require("../../../DB/models/streak.model");

const { containsBadWords, maxStrikes } = require("../../../script/common");

/* ================= ADD COMMENT ================= */
module.exports.addcomment = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const { body } = req.body;
    const now = new Date();
    const user = await userModel.findById(req.user.id);
    if (!user) return res.error("User not found", null, 404);

    const post = await postModel.findById(id);
    if (!post) return res.error("Post not found", null, 404);

    // ✅ if blocked stop
    if (user.blocked) {
      return res.error("Your account is blocked", null, 403);
    }
    if (body && containsBadWords(body)) {
      const updatedUser = await userModel
        .findByIdAndUpdate(
          req.user.id,
          { $inc: { badWordsNumber: 1 } },
          { new: true }
        )
        .select("badWordsNumber blocked");
      const remaining = Math.max(0, maxStrikes - updatedUser.badWordsNumber);

      return res.error(
        `Your post contains inappropriate language. You have ${remaining} allowed attempts left.`,
        { remaining, badWordsNumber: updatedUser.badWordsNumber },
        400
      );
    }
    const comment = await commentModel.create({
      body,
      comment_by: [user._id],
      post_id: [post._id],
    });

    await postModel.findByIdAndUpdate(id, {
      $push: { comments: comment._id },
    });
    await userModel.findByIdAndUpdate(user._id, {
      $inc: { numberOfReplies: 1, pointer: 1 },
    });
    const postOwnerId = post.createdBy.toString();
    if (postOwnerId !== user._id) {
      await notificationModel.create({
        title: "New Comment",
        message: `${user.firstName} commented on your post`,
        type: "comment",
        receiver: postOwnerId,
        sender: comment._id,
        relatedId: post._id,
      });
    }
    await UserStreakModel.updateOne(
      { userId: user._id, "lastActivity.type": "comments" },
      {
        $inc: { "lastActivity.$.points": 1 }, // 👈 change 1 to whatever you want
        $set: {
          "lastActivity.$.message": "You added a comment",
          "lastActivity.$.createdAt": now,
          lastActiveAt: now,
        },
      }
    );
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
    const now = new Date();
    const user = await userModel.findById(req.user.id);
    if (!user) return res.error("User not found", null, 404);

    const parentComment = await commentModel.findById(commentId);
    if (!parentComment) return res.error("Comment not found", null, 404);
    if (body && containsBadWords(body)) {
      const updatedUser = await userModel
        .findByIdAndUpdate(
          req.user.id,
          { $inc: { badWordsNumber: 1 } },
          { new: true }
        )
        .select("badWordsNumber blocked");
      const remaining = Math.max(0, maxStrikes - updatedUser.badWordsNumber);

      return res.error(
        `Your post contains inappropriate language. You have ${remaining} allowed attempts left.`,
        { remaining, badWordsNumber: updatedUser.badWordsNumber },
        400
      );
    }
    const reply = await commentModel.create({
      body,
      comment_by: [user._id],
      post_id: parentComment.post_id,
    });
    res.locals.createdId = reply._id;

    await commentModel.findByIdAndUpdate(parentComment._id, {
      $push: { replies: reply._id },
    });
    await userModel.findByIdAndUpdate(user._id, {
      $inc: { numberOfReplies: 1, pointer: 1 },
    });
    await UserStreakModel.updateOne(
      { userId: user._id, "lastActivity.type": "comments" },
      {
        $inc: { "lastActivity.$.points": 1 }, // 👈 change 1 to whatever you want
        $set: {
          "lastActivity.$.message": "You added a comment",
          "lastActivity.$.createdAt": now,
          lastActiveAt: now,
        },
      }
    );
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
    const user = await userModel
      .findById(userId)
      .select("badWordsNumber blocked");
    if (!user) return res.error("User not found", null, 404);

    // ✅ if blocked stop
    if (user.blocked) {
      return res.error("Your account is blocked", null, 403);
    }
    const comment = await commentModel.findById(id);
    if (!comment) return res.error("Comment not found", null, 404);
    const isOwner = comment.comment_by.toString() === userId;
    const isAdmin = user.role === "admin";

    // ✅ OWNER OR ADMIN
    if (!isOwner && !isAdmin) {
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
    const user = await userModel
      .findById(userId)
      .select("badWordsNumber blocked");
    if (!user) return res.error("User not found", null, 404);

    // ✅ if blocked stop
    if (user.blocked) {
      return res.error("Your account is blocked", null, 403);
    }
    const comment = await commentModel.findById(id);
    if (!comment) return res.error("Comment not found", null, 404);
    const repliesCount = comment.replies?.length || 0;
    const totalDeleted = 1 + repliesCount;
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
    await userModel.findOneAndUpdate(
      { _id: userId, numberOfReplies: { $gt: 0 } },
      { $inc: { numberOfReplies: -1, pointer: -1 } }
    );
    await UserStreakModel.updateOne(
      { userId, "lastActivity.type": "comments" },
      {
        $inc: { "lastActivity.$.points": -totalDeleted },
        $set: {
          "lastActivity.$.message": "Deleted comment (with replies)",
          "lastActivity.$.createdAt": new Date(),
          lastActiveAt: new Date(),
        },
      }
    );
    return res.success("Comment and replies deleted successfully");
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

module.exports.likeandunlikecomment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const user = await userModel
      .findById(userId)
      .select("badWordsNumber blocked firstName");
    if (!user) return res.error("User not found", null, 404);

    // ✅ if blocked stop
    if (user.blocked) {
      return res.error("Your account is blocked", null, 403);
    }
    const comment = await commentModel.findById(id);
    if (!comment) return res.error("Comment not found", null, 404);

    const isLiked = comment.likes.some(
      (like) => like.toString() === userId.toString()
    );

    const isOwner = comment.comment_by.toString() === userId.toString();

    const update = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedComment = await commentModel
      .findByIdAndUpdate(id, update, { new: true })
      .populate({
        path: "comment_by",
        select: "firstName lastName email profile_picture country",
        populate: {
          path: "country",
          select: "name isoCode dialCode flag",
        },
      });

    // 🔥 Update points for comment owner
    if (!isOwner) {
      await userModel.findByIdAndUpdate(
        comment.comment_by,
        { $inc: { pointer: isLiked ? -1 : 1 } },
        { new: true }
      );
    }
    res.locals.points = isLiked ? -1 : 1;
    if (!isLiked && !isOwner) {
      await notificationModel.create({
        title: "New Like",
        message: `${user.firstName} liked your comment`,
        type: "comment",
        receiver: comment.comment_by, // comment owner
        sender: userId, // liker user
        relatedId: comment._id, // comment id
        postId: comment.post_id, // optional (if your schema supports it)
      });
    }
    return res.success(isLiked ? "Comment unliked" : "Comment liked", {
      comment: updatedComment,
      likesCount: updatedComment.likes.length,
      likedByUser: !isLiked,
    });
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};
