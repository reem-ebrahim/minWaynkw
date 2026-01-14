const { GCC_COUNTRIES, Country } = require("../DB/models/country.model");

module.exports = async function seedGccCountries() {
  for (const country of GCC_COUNTRIES) {
    await Country.updateOne(
      { isoCode: country.isoCode },
      { $setOnInsert: country },
      { upsert: true }
    );
  }

  console.log("✅ GCC countries seeded");
};
