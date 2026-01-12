const jwt = require("jsonwebtoken");
const { Profanity } = require("@2toad/profanity");

const path = require("path");
const { paginate } = require("../../../services/paginate");
const postModel = require("../../../DB/models/post.model");
const {
  checkBadContent,
  moderateText,
} = require("../../../services/checkContent");
const userModel = require("../../../DB/models/user.model");
const commentModel = require("../../../DB/models/comment.model");
// const { ProfanityEngine } = require("@coffeeandfun/google-profanity-words");
// const profanity = new Profanity({
//   languages: ["ar"],
//   wholeWord: false,
//   grawlix: "*****",
//   grawlixChar: "$",
// });
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports.getAllPosts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      isDeleted: false,
      hidden: false,
    };

    const posts = await postModel
      .find(filter)
      .populate("createdBy", "fullName email profile_picture")
      .populate("likes", "fullName email profile_picture")
      .populate({
        path: "comments",
        populate: [
          {
            path: "comment_by",
            select: "fullName email profile_picture",
          },
          {
            path: "replies",
            populate: {
              path: "comment_by",
              select: "fullName email profile_picture",
            },
          },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await postModel.countDocuments(filter);

    return res.success("Posts fetched successfully", {
      total,
      page,
      pages: Math.ceil(total / limit),
      posts,
    });
  } catch (error) {
    console.error(error);
    return res.error("Internal server error", null, 500);
  }
};

module.exports.createPost = async (req, res) => {
  try {
    const { text } = req.body;

    if (req.imagevalidtype) {
      return res.error("Invalid file type", null, 400);
    }

    const images = req.files?.images
      ? req.files.images.map((file) => `${req.destination}/${file.filename}`)
      : [];

    // videos (optional)
    const videos = req.files?.videos
      ? req.files.videos.map((file) => `${req.destination}/${file.filename}`)
      : [];

    const post = await postModel.create({
      text,
      images,
      videos,
      createdBy: req.user.id,
    });

    return res.success("Post created successfully", post, 201);
  } catch (error) {
    console.error("Create Post Error:", error);
    return res.error("Internal server error", null, 500);
  }
};

module.exports.likeAndUnlikePost = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const userId = req.user.id;

    // ✅ check user
    const user = await userModel.findById(userId);
    if (!user) return res.error("User not found", null, 404);

    // ✅ check post
    const post = await postModel.findById(id);
    if (!post) return res.error("Post not found", null, 404);

    // ✅ like / unlike logic
    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      await post.save();

      return res.success("Post liked", {
        postId: post._id,
        likesCount: post.likes.length,
        liked: true,
      });
    } else {
      post.likes.pull(userId);
      await post.save();

      return res.success("Post unliked", {
        postId: post._id,
        likesCount: post.likes.length,
        liked: false,
      });
    }
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

module.exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const userId = req.user.id;

    // ✅ check post
    const post = await postModel.findById(id);
    if (!post) return res.error("Post not found", null, 404);

    // ✅ authorization
    if (post.createdBy.toString() !== userId) {
      return res.error("Not authorized", null, 403);
    }

    // =========================
    // 1️⃣ get all comments of post
    // =========================
    const comments = await commentModel.find({ post_id: id }).select("_id replies");

    // =========================
    // 2️⃣ collect replies ids
    // =========================
    const replyIds = comments.flatMap(comment => comment.replies);

    // =========================
    // 3️⃣ delete replies
    // =========================
    if (replyIds.length > 0) {
      await commentModel.deleteMany({ _id: { $in: replyIds } });
    }

    // =========================
    // 4️⃣ delete comments
    // =========================
    await commentModel.deleteMany({ post_id: id });

    // =========================
    // 5️⃣ delete post
    // =========================
    await postModel.findByIdAndDelete(id);

   
    

    return res.success("Post and related comments deleted successfully");
  } catch (error) {
    console.error(error);
    return res.error("Server error", error.message, 500);
  }
};
