require("dotenv").config();

const { GCC_COUNTRIES, Country } = require("../DB/models/country.model");
const userModel = require("../DB/models/user.model");
const { generateNickname } = require("./common");

module.exports = async function upsertAdmin({
  firstName,
  lastName,
  email,
  password,
  role,
}) {
  const normalizedEmail = email.toLowerCase().trim();

  const exists = await userModel.findOne({ email: normalizedEmail });
  if (exists) {
    // ensure role is correct
    if (exists.role !== role) {
      exists.role = role;
      await exists.save();
    }
    console.log(`ℹ️ Exists: ${role} -> ${normalizedEmail}`);
    return;
  }
    const nickname = await generateNickname(firstName, lastName);

  const user = new userModel({
    firstName,
    lastName,
    nickName:nickname,
    email: normalizedEmail,
    password: password, // ✅ مشفر
    confirmed: true, // verified مباشرة
    role,
  });

  await user.save();
  console.log(`✅ Created: ${role} -> ${normalizedEmail}`);
};
