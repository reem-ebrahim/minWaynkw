const countryModel = require("../../../DB/models/country.model");


module.exports.getCountries = async (req, res) => {
  try {
    const countries = await countryModel.Country.find().sort({ name: 1 });
    return res.success("Countries fetched", countries);
  } catch (err) {
    return res.error("Server error", err.message, 500);
  }
};

module.exports.addCountry = async (req, res) => {
  try {
    const { name, isoCode, dialCode, flag } = req.body;

    const country = await countryModel.Country.create({
      name,
      isoCode: isoCode.toUpperCase().trim(),
      dialCode,
      flag,
    });

    return res.success("Country added", country, 201);
  } catch (err) {
    // duplicate key error (unique fields)
    if (err.code === 11000) {
      return res.error("Country already exists", err.keyValue, 409);
    }

    return res.error("Server error", err.message, 500);
  }
};


module.exports.editCountry = async (req, res) => {
  try {
    const { id } = req.params;

    // allow only updating dialCode/flag if you want to override CDN, etc.
    // but keep GCC restriction by isoCode/name enum
    const { dialCode, flag } = req.body;

    const country = await countryModel.Country.findById(id);
    if (!country) return res.error("Country not found", null, 404);

    // optional: restrict edits to only these fields
    const update = {};
    if (dialCode) update.dialCode = dialCode;
    if (flag) update.flag = flag;

    const updated = await countryModel.Country.findByIdAndUpdate(id, update, { new: true });
    return res.success("Country updated", updated);
  } catch (err) {
    return res.error("Server error", err.message, 500);
  }
};

module.exports.deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const country = await countryModel.Country.findById(id);
    if (!country) return res.error("Country not found", null, 404);

    await countryModel.Country.findByIdAndDelete(id);
    return res.success("Country deleted", null);
  } catch (err) {
    return res.error("Server error", err.message, 500);
  }
};
