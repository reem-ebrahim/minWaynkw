const mongoose = require("mongoose");

const GCC_COUNTRIES = [
  {
    name: "Saudi Arabia",
    isoCode: "SA",
    dialCode: "+966",
    flag: "https://flagcdn.com/w320/sa.png",
  },
  {
    name: "United Arab Emirates",
    isoCode: "AE",
    dialCode: "+971",
    flag: "https://flagcdn.com/w320/ae.png",
  },
  {
    name: "Kuwait",
    isoCode: "KW",
    dialCode: "+965",
    flag: "https://flagcdn.com/w320/kw.png",
  },
  {
    name: "Qatar",
    isoCode: "QA",
    dialCode: "+974",
    flag: "https://flagcdn.com/w320/qa.png",
  },
  {
    name: "Bahrain",
    isoCode: "BH",
    dialCode: "+973",
    flag: "https://flagcdn.com/w320/bh.png",
  },
  {
    name: "Oman",
    isoCode: "OM",
    dialCode: "+968",
    flag: "https://flagcdn.com/w320/om.png",
  },
];

const countrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: GCC_COUNTRIES.map((c) => c.name), // 🔒 GCC only
      unique: true,
    },
    isoCode: {
      type: String,
      required: true,
      enum: GCC_COUNTRIES.map((c) => c.isoCode),
      uppercase: true,
      unique: true,
    },
    dialCode: {
      type: String,
      required: true,
      enum: GCC_COUNTRIES.map((c) => c.dialCode),
    },
    flag: {
      type: String, // emoji or image URL
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = {
  Country: mongoose.model("Country", countrySchema),
  GCC_COUNTRIES, // export for seeding
};
