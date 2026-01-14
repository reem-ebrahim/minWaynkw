const router = require("express").Router();

const countryController = require("./controler/country.service");
const { auth } = require("../../Middleware/auth");

const { endpoint } = require("./controler/country.endpoint");
const {
  createCountrySchema,
  updateCountrySchema,
  deleteCountrySchema,
} = require("./controler/country.valid");
const { validate } = require("../../Middleware/validation");

// public (or authenticated) list
router.get("/", countryController.getCountries);

router.post(
  "/",
  auth(endpoint.AllUser),
  validate(createCountrySchema),
  countryController.addCountry
);

router.put(
  "/:id",
  auth(endpoint.AllUser),
  validate(updateCountrySchema),
  countryController.editCountry
);

router.delete(
  "/:id",
  auth(endpoint.AllUser),
  validate(deleteCountrySchema),
  countryController.deleteCountry
);

module.exports = router;
