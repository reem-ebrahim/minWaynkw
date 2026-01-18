const postModel = require("../../../DB/models/post.model");
const userModel = require("../../../DB/models/user.model");
const commentModel = require("../../../DB/models/comment.model");
const {
  containsBadWords,
  maxStrikes,
  containsBadWordsMixed,
} = require("../../../script/common");
const bannerModel = require("../../../DB/models/banner.model");
const { roles } = require("../../../Middleware/auth");
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

    const me = await userModel.findById(req.user.id).select("country");
    if (!me) return res.error("User not found", null, 404);

    // ✅ base filter (always applied)
    const filter = {
      isDeleted: false,
      hidden: false,
    };

    // ✅ apply country filter ONLY if user has country
    if (me.country) {
      const sameCountryUsers = await userModel
        .find({ country: me.country })
        .select("_id");

      const sameCountryUserIds = sameCountryUsers.map((u) => u._id);

      filter.createdBy = { $in: sameCountryUserIds };
    }
    // ❌ no else → if no country, fetch all posts

    const posts = await postModel
      .find(filter)
      .populate({
        path: "createdBy",
        select: "firstName lastName email profile_picture country",
        populate: {
          path: "country",
          select: "name isoCode dialCode flag",
        },
      })
      .populate({
        path: "likes",
        select: "firstName lastName email profile_picture country",
        populate: {
          path: "country",
          select: "name isoCode dialCode flag",
        },
      })
      .populate({
        path: "comments",
        populate: [
          {
            path: "comment_by",
            select: "firstName lastName email profile_picture country",
            populate: {
              path: "country",
              select: "name isoCode dialCode flag",
            },
          },
          {
            path: "replies",
            populate: {
              path: "comment_by",
              select: "firstName lastName email profile_picture country",
              populate: {
                path: "country",
                select: "name isoCode dialCode flag",
              },
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
    return res.error("Internal server error", error.message, 500);
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
    const user = await userModel
      .findById(req.user.id)
      .select("badWordsNumber blocked role");
    if (!user) return res.error("User not found", null, 404);

    // ✅ if blocked stop
    if (user.blocked) {
      return res.error("Your account is blocked", null, 403);
    }
    if (text && containsBadWordsMixed(text)) {
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

    const post = await postModel.create({
      text,
      images,
      videos,
      createdBy: req.user.id,
    });
    res.locals.createdId = post._id;
    await userModel.findByIdAndUpdate(req.user.id, {
      $inc: { numberOfPosts: 1, pointer: 1 },
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
    const user = await userModel
      .findById(req.user.id)
      .select("badWordsNumber blocked role");
    if (!user) return res.error("User not found", null, 404);

    // ✅ if blocked stop
    if (user.blocked) {
      return res.error("Your account is blocked", null, 403);
    }
    const post = await postModel.findById(id);
    if (!post) return res.error("Post not found", null, 404);

    const isLiked = post.likes.some(
      (like) => like.toString() === userId.toString()
    );

    const isOwner = post.createdBy.toString() === userId.toString();

    const update = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedPost = await postModel.findByIdAndUpdate(id, update, {
      new: true,
    });

    // 🔥 Update points / counter for post owner (optional: block self-like)
    if (!isOwner) {
      await userModel.findByIdAndUpdate(post.createdBy, {
        $inc: { pointer: isLiked ? -1 : 1 }, // or points
      });
    }
    res.locals.didLike = isLiked;
    return res.success(isLiked ? "Post unliked" : "Post liked", {
      postId: updatedPost._id,
      likesCount: updatedPost.likes.length,
      liked: !isLiked,
    });
  } catch (error) {
    return res.error("Server error", error.message, 500);
  }
};

module.exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const userId = req.user.id;
    const user = await userModel
      .findById(req.user.id)
      .select("badWordsNumber blocked role");
    if (!user) return res.error("User not found", null, 404);

    // ✅ if blocked stop
    if (user.blocked) {
      return res.error("Your account is blocked", null, 403);
    }

    const post = await postModel.findById(id);
    if (!post) return res.error("Post not found", null, 404);
    const isOwner = post.createdBy.toString() === userId;

    const isAdmin = user.role === roles.admin;

    if (!isOwner && !isAdmin) {
      return res.error("Not authorized", null, 403);
    }

    // =========================
    // 1️⃣ get all comments of post
    // =========================
    const comments = await commentModel
      .find({ post_id: id })
      .select("_id replies");

    // =========================
    // 2️⃣ collect replies ids
    // =========================
    const replyIds = comments.flatMap((comment) => comment.replies);

    if (replyIds.length > 0) {
      await commentModel.deleteMany({ _id: { $in: replyIds } });
    }

    await commentModel.deleteMany({ post_id: id });

    await postModel.findByIdAndDelete(id);
    await userModel.findByIdAndUpdate(post.createdBy, {
      $inc: { numberOfPosts: -1, pointer: -1 },
    });
    return res.success("Post and related comments deleted successfully");
  } catch (error) {
    console.error(error);
    return res.error("Server error", error.message, 500);
  }
};

module.exports.getAllPostsAndBanners = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const now = new Date();

    const postsQuery = postModel
      .find({ isDeleted: false, hidden: false })
      .populate({
        path: "createdBy",
        select: "firstName lastName email profile_picture country",
        populate: { path: "country", select: "name isoCode dialCode flag" },
      })
      .populate({
        path: "likes",
        select: "firstName lastName email profile_picture country",
        populate: { path: "country", select: "name isoCode dialCode flag" },
      })
      .populate({
        path: "comments",
        populate: [
          {
            path: "comment_by",
            select: "firstName lastName email profile_picture country",
            populate: { path: "country", select: "name isoCode dialCode flag" },
          },
          {
            path: "replies",
            populate: {
              path: "comment_by",
              select: "firstName lastName email profile_picture country",
              populate: {
                path: "country",
                select: "name isoCode dialCode flag",
              },
            },
          },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalQuery = postModel.countDocuments({
      isDeleted: false,
      hidden: false,
    });

    const bannersQuery = bannerModel
      .find({
        startDate: { $lte: now },
        $or: [{ endDate: null }, { endDate: { $gte: now } }],
      })
      .sort({ createdAt: -1 })
      .populate({
        path: "createdBy",
        select: "firstName lastName email profile_picture country",
        populate: { path: "country", select: "name isoCode dialCode flag" },
      });

    const [posts, total, banners] = await Promise.all([
      postsQuery,
      totalQuery,
      bannersQuery,
    ]);

    return res.success("Posts and banners fetched successfully", {
      posts: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
        items: posts,
      },
      banners: {
        total: banners.length,
        items: banners,
      },
    });
  } catch (error) {
    return res.error("Internal server error", error.message, 500);
  }
};
