const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const mongoose = require("mongoose");
const upsertAdmin = require("../script/admin");
const countryCodeAdmin = require("../script/countryCode");
const UserStreak = require("../DB/models/streak.model");

require("dotenv").config();

module.exports.connectdb = () => {
  return mongoose
    .connect(process.env.MONGOURL, {
      serverSelectionTimeoutMS: 10000,
    })
    .then(async () => {
      console.log("done connect");
      await upsertAdmin({
        firstName: "Admin",
        lastName: "Account",
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: "admin",
      });

      await upsertAdmin({
        firstName: "Super",
        lastName: "Admin",
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        role: "super_admin",
      });
      await countryCodeAdmin(); // 🔥 runs once safely
    })

    .catch((error) => {
      console.log("error connect", error);
    });
};
