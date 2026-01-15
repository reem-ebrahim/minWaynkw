const jwt = require("jsonwebtoken");
const userModel = require("../../../DB/models/user.model");
const sendEmail = require("../../../services/sendEmail");
const bcrypt = require("bcrypt");
const countryModel = require("../../../DB/models/country.model");
const { default: mongoose } = require("mongoose");
const commentModel = require("../../../DB/models/comment.model");
const postModel = require("../../../DB/models/post.model");
const { generateNickname } = require("../../../script/common");
const { roles } = require("../../../Middleware/auth");

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, country } =
      req.body;

    const role = "user";

    // ✅ check country exists
    const countryexist = await countryModel.Country.findById(country);
    if (!countryexist) {
      return res.error("Invalid country", null, 400);
    }
    if (!phoneNumber.startsWith(countryexist.dialCode)) {
      return res.error(
        `Phone number must start with ${countryexist.dialCode}`,
        null,
        400
      );
    }
    // ✅ generate verification code
    const code = generateCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const nickname = await generateNickname(firstName, lastName);
    const user = new userModel({
      firstName,
      lastName,
      nickName: nickname,
      email,
      password, // سيتم تشفيره في pre-save
      phoneNumber,
      country: countryexist._id,
      code: hashedCode,
      verificationCodeExpires: Date.now() + 10 * 60 * 1000,
      role,
    });

    await user.save();

    const message = `
      <h3>Email Verification</h3>
      <p>Your verification code is:</p>
      <h2>${code}</h2>
      <p>This code expires in 10 minutes.</p>
    `;

    await sendEmail.sendConfirmationEmail({
      to: email,
      name: `${firstName} ${lastName}`,
      link: message,
    });

    return res.success(
      "Signup successful. Verification code sent to email.",
      null,
      201
    );
  } catch (error) {
    // duplicate email or phone
    if (error.code === 11000) {
      return res.error(
        "Email or phone number already exists",
        error.keyValue,
        409
      );
    }

    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.confirm = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) return res.error("Token is required", null, 400);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWTEMAIL);
    } catch (err) {
      return res.error("Invalid or expired token", null, 400);
    }

    const user = await userModel.findById(decoded.id).select("confirmed");
    if (!user) return res.error("User not found", null, 404);

    if (user.confirmed) return res.success("Email already confirmed");

    await userModel.findByIdAndUpdate(decoded.id, { confirmed: true });

    return res.success("Email confirmed successfully");
  } catch (error) {
    console.error(error);
    return res.error("Internal server error", null, 500);
  }
};

module.exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.error("User not found", null, 404);
    }

    if (!user.confirmed) {
      const code = generateCode();
      const hashedCode = await bcrypt.hash(code, 10);
      await userModel.findOneAndUpdate(
        { email },
        {
          code: hashedCode,
          emailVerificationExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
        },
        { new: true }
      );
      const message = `
      <h3>Email Verification</h3>
      <p>Your verification code is:</p>
      <h2>${code}</h2>
      <p>This code expires in 10 minutes.</p>
    `;

      await sendEmail.sendConfirmationEmail({
        to: email,
        name: `${user.firstName} ${user.lastName}`,
        link: message,
      });
      return res.error("Please confirm your email first", null, 400);
    }

    if (user.blocked) {
      return res.error("Your account has been blocked by admin", null, 403);
    }

    if (user.badWordsNumber >= 3) {
      return res.error("This account was deleted", null, 410);
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.error("Invalid email or password", null, 400);
    }

    const token = jwt.sign(
      { id: user._id, isLogged: true },
      process.env.JWTAUTH,
      { expiresIn: "60d" }
    );

    return res.success("Signin successful", {
      token,
      user: user,
    });
  } catch (error) {
    return res.error("Internal server error", null, 500);
  }
};
module.exports.profile = async (req, res) => {
  try {
    const { email, firstName, lastName, nickName } = req.body;

    const user = await userModel
      .findById(req.user.id)
      .select("email confirmed firstName lastName");
    if (!user) return res.error("User not found", null, 404);

    const update = {};
    let emailChanged = false;

    if (firstName && firstName !== user.firstName) update.firstName = firstName;
    if (lastName && lastName !== user.lastName) update.lastName = lastName;

    if (email && email !== user.email) {
      const emailExists = await userModel.findOne({
        email,
        _id: { $ne: user._id },
      });

      if (emailExists) return res.error("Email already in use", null, 409);

      update.email = email;
      update.confirmed = false;
      emailChanged = true;
    }
    if (user.role == roles.admin || user.role == roles.super_admin) {
      if (nickName) {
        update.nickName = nickName;
      }
    }
    if (req.imagevalidtype) return res.error("Invalid image type", null, 400);

    if (req.file) {
      update.profile_picture = `${req.destination}/${req.file.filename}`;
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(
        req.user.id,
        { $set: update },
        { new: true, runValidators: true }
      )
      .select("email firstName lastName confirmed");

    if (emailChanged) {
      const code = generateCode();
      const hashedCode = await bcrypt.hash(code, 10);
      await userModel.findOneAndUpdate(
        { email },
        {
          code: hashedCode,
          emailVerificationExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
        },
        { new: true }
      );
      const message = `
      <h3>Email Verification</h3>
      <p>Your verification code is:</p>
      <h2>${code}</h2>
      <p>This code expires in 10 minutes.</p>
    `;

      await sendEmail.sendConfirmationEmail({
        to: email,
        name: `${user.firstName} ${user.lastName}`,
        link: message,
      });
      return res.success("Please confirm your email first", {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        confirmed: updatedUser.confirmed,
      });
    }

    return res.success("Profile updated successfully", {
      id: updatedUser._id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      confirmed: updatedUser.confirmed,
    });
  } catch (error) {
    console.error(error);
    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.profiledelete = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const currentUser = await userModel.findById(req.user.id).session(session);
    if (!currentUser) {
      await session.abortTransaction();
      session.endSession();
      return res.error("User not found", null, 404);
    }

    const userToDelete = await userModel.findById(id).session(session);
    if (!userToDelete) {
      await session.abortTransaction();
      session.endSession();
      return res.error("Target user not found", null, 404);
    }

    const isOwner = currentUser._id.equals(userToDelete._id);
    const isAdmin =
      currentUser.role === "admin" || currentUser.role === "super_admin";

    if (!isOwner && !isAdmin) {
      await session.abortTransaction();
      session.endSession();
      return res.error("You are not allowed to delete this account", null, 403);
    }

    // ✅ delete user's comments
    const commentsResult = await commentModel.deleteMany(
      { comment_by: userToDelete._id },
      { session }
    );

    // ✅ delete user's posts
    const postsResult = await postModel.deleteMany(
      { createdBy: userToDelete._id },
      { session }
    );

    // ✅ delete user
    await userModel.deleteOne({ _id: userToDelete._id }, { session });

    await session.commitTransaction();
    session.endSession();

    return res.success("User deleted successfully", {
      id: userToDelete._id,
      email: userToDelete.email,
      deletedPosts: postsResult.deletedCount,
      deletedComments: commentsResult.deletedCount,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.sendVerifyEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email }).select("_id nickName");
    if (!user) return res.error("User not found", null, 404);

    const code = generateCode();
    const hashedCode = await bcrypt.hash(code, 10);

    await userModel.findByIdAndUpdate(user._id, {
      $set: {
        code: hashedCode,
        verificationCodeExpires: Date.now() + 10 * 60 * 1000,
      },
    });

    const message = `
      <h3>Email Verification</h3>
      <p>Your new verification code is:</p>
      <h2>${code}</h2>
      <p>This code expires in 10 minutes.</p>
    `;

    await sendEmail.sendConfirmationEmail({
      to: email,
      name: user?.nickName,
      link: message,
    });

    return res.success("Verification code resent successfully");
  } catch (error) {
    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.forgetpassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.error("Email and new password are required", null, 400);
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) return res.error("User not found", null, 404);

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.error(
        "New password must be different from the old password",
        null,
        409
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await userModel.findByIdAndUpdate(user._id, {
      $set: { password: hashed },
    });

    return res.success("Password reset successfully", null, 200);
  } catch (error) {
    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;

    const user = await userModel.findById(userId).select("+password");
    if (!user) return res.error("User not found", null, 404);

    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      user.password
    );
    if (!isOldPasswordCorrect) {
      return res.error("Old password is incorrect", null, 401);
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.error(
        "New password must be different from old password",
        null,
        409
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await userModel.findByIdAndUpdate(userId, {
      $set: { password: hashed },
    });

    return res.success("Password changed successfully", null, 200);
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.error("Internal server error", error.message, 500);
  }
};
module.exports.getUserByToken = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId).select("-password -__v");

    if (!user) {
      return res.error("User not found", null, 404);
    }

    return res.success("User fetched successfully", { user: user }, 200);
  } catch (error) {
    console.error("Get User By Token Error:", error);

    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.confirmByCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.error("Email and code are required", null, 400);
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.error("User not found", null, 404);
    }

    if (!user.code || !user.verificationCodeExpires) {
      return res.error("No verification code found", null, 400);
    }

    if (Date.now() > user.verificationCodeExpires) {
      return res.error("Verification code expired", null, 400);
    }

    const isValidCode = await bcrypt.compare(code, user.code);

    if (!isValidCode) {
      return res.error("Invalid verification code", null, 400);
    }

    await userModel.findByIdAndUpdate(
      user._id,
      {
        confirmed: true,
        $unset: {
          code: "",
          verificationCodeExpires: "",
        },
      },
      { new: true }
    );

    return res.success("Email confirmed successfully");
  } catch (error) {
    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.editPointer = async (req, res) => {
  try {
    const { pointer } = req.body;

    const updatedUser = await userModel
      .findByIdAndUpdate(
        req.user.id,
        { $set: { pointer } },
        { new: true, runValidators: true }
      )
      .select("email firstName lastName confirmed");

    if (!updatedUser) return res.error("User not found", null, 404);

    return res.success("Profile updated successfully", {
      id: updatedUser._id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      confirmed: updatedUser.confirmed,
    });
  } catch (error) {
    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.getAllUserSubAdmin = async (req, res) => {
  try {
    // (optional) admin only
    const currentUser = await userModel.findById(req.user.id);
    if (!currentUser) return res.error("User not found", null, 404);

    const users = await userModel
      .find({ role: "user" })
      .select("-password -code -verificationCodeExpires -__v");

    return res.success("Users fetched successfully", users, 200);
  } catch (error) {
    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.assignVipLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { vipLevel } = req.body;

    const level = Number(vipLevel);
    if (!Number.isInteger(level) || level < 1 || level > 100) {
      return res.error(
        "vipLevel must be an integer between 1 and 100",
        null,
        400
      );
    }

    const currentUser = await userModel.findById(req.user.id).select("role");
    if (!currentUser) return res.error("User not found", null, 404);

    const targetUser = await userModel.findById(id).select("pointer vipLevel");
    if (!targetUser) return res.error("Target user not found", null, 404);

    if ((targetUser.pointer || 0) < 500) {
      return res.error(
        "User must have pointer >= 500 to assign VIP level",
        null,
        400
      );
    }

    const updated = await userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            vipLevel: level,
            role: roles.super_admin,
            nicKName: targetUser.firstName + targetUser.lastName + level,
          },
        },
        { new: true }
      )
      .select("pointer vipLevel");

    return res.success(
      "VIP level assigned successfully",
      {
        userId: id,
        pointer: updated.pointer,
        vipLevel: updated.vipLevel,
      },
      200
    );
  } catch (error) {
    return res.error("Internal server error", error.message, 500);
  }
};
