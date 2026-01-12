const jwt = require("jsonwebtoken");
const userModel = require("../../../DB/models/user.model");
const sendEmail = require("../../../services/sendEmail");
const bcrypt = require("bcrypt");

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const code = generateCode();
    const hashedCode = await bcrypt.hash(code, 10);

    const user = new userModel({
      fullName,
      email,
      password,
      code: hashedCode,
      verificationCodeExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
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
      name: `${fullName}`,
      link: message,
    });

    return res.success(
      "Signup successful. Verification code sent to email.",
      null,
      201
    );
  } catch (error) {
    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.confirm = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.error("Token is required", null, 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWTEMAIL);
    } catch (err) {
      return res.error("Invalid or expired token", null, 400);
    }
    console.log(decoded, "decodedd");
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.error("User not found", null, 404);
    }

    if (user.confirmed) {
      return res.success("Email already confirmed");
    }

    user.confirmed = true;
    await user.save();

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
      { expiresIn: "24h" }
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
    const { email, fullName } = req.body;

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.error("User not found", null, 404);
    }

    let emailChanged = false;

    if (fullName && fullName !== user.fullName) {
      user.fullName = fullName;
    }

    if (email && email !== user.email) {
      const emailExists = await userModel.findOne({
        email,
        _id: { $ne: user._id },
      });

      if (emailExists) {
        return res.error("Email already in use", null, 409);
      }

      user.email = email;
      user.confirmed = false;
      emailChanged = true;
    }

    if (req.imagevalidtype) {
      return res.error("Invalid image type", null, 400);
    }

    if (req.file) {
      user.profile_picture = `${req.destination}/${req.file.filename}`;
    }

    await user.save();

    if (emailChanged) {
      const token = jwt.sign({ id: user._id }, process.env.JWTEMAIL, {
        expiresIn: "30d",
      });

      const URL = `${process.env.DOMAIN}/api/user/confirmEmail/${token}`;
      const message = `<a href="${URL}">Confirm your new email</a>`;

      // enable when SMTP ready
      await sendEmail.sendConfirmationEmail({
        to: saveUser.email,
        name: saveUser.name,
        link: message,
      });
    }

    return res.success("Profile updated successfully", {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      confirmed: user.confirmed,
    });
  } catch (error) {
    return res.error("Internal server error", null, 500);
  }
};

module.exports.profiledelete = async (req, res) => {
  try {
    const { id } = req.params;

    const currentUser = await userModel.findById(req.user.id);
    if (!currentUser) {
      return res.error("User not found", null, 404);
    }

    const userToDelete = await userModel.findById(id);
    if (!userToDelete) {
      return res.error("Target user not found", null, 404);
    }

    const isOwner = currentUser._id.equals(userToDelete._id);
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.error("You are not allowed to delete this account", null, 403);
    }

    await userModel.findByIdAndDelete(id);

    return res.success("User deleted successfully", {
      id: userToDelete._id,
      email: userToDelete.email,
    });
  } catch (error) {
    return res.error("Internal server error", null, 500);
  }
};

module.exports.sendVerifyEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.error("User not found", null, 404);
    }

    if (user.confirmed) {
      return res.error("Email already confirmed", null, 400);
    }

    const code = generateCode();
    user.code = await bcrypt.hash(code, 10);
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const message = `
      <h3>Email Verification</h3>
      <p>Your new verification code is:</p>
      <h2>${code}</h2>
      <p>This code expires in 10 minutes.</p>
    `;

    await sendEmail.sendConfirmationEmail({
      to: email,
      name: user.fullName,
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

    // Validation
    if (!email || !newPassword) {
      return res.error("Email and new password are required", null, 400);
    }

    const user = await userModel.findOne({ email });

    // User not found
    if (!user) {
      return res.error("User not found", null, 404);
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.error(
        "New password must be different from the old password",
        null,
        409
      );
    }

    // Update password
    await userModel.findByIdAndUpdate(user._id, { password: newPassword });

    // Success response
    return res.success("Password reset successfully", null, 200);
  } catch (error) {
    return res.error("Internal server error", error.message, 500);
  }
};

module.exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id; // assuming auth middleware sets req.user

    // Find user
    const user = await userModel.findById(userId).select("+password");

    if (!user) {
      return res.error("User not found", null, 404);
    }

    // Verify old password
    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      user.password
    );

    if (!isOldPasswordCorrect) {
      return res.error("Old password is incorrect", null, 401);
    }

    // Prevent same password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.error(
        "New password must be different from old password",
        null,
        409
      );
    }

    user.password = newPassword;
    await user.save();

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

    return res.success("User fetched successfully", user, 200);
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

    if (user.confirmed) {
      return res.success("Email already confirmed");
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

    user.confirmed = true;
    user.code = undefined;
    user.verificationCodeExpires = undefined;

    await user.save();

    return res.success("Email confirmed successfully");
  } catch (error) {
    return res.error("Internal server error", error.message, 500);
  }
};
