const schemaTypes = ["body", "params", "query", "headers", "file", "files"];

module.exports.validate = (schema) => {
  return (req, res, next) => {
    try {
      const errors = [];

      schemaTypes.forEach((type) => {
        if (schema[type]) {
          const { error } = schema[type].validate(req[type], {
            abortEarly: false,
            allowUnknown: type === "headers", // allow extra headers
          });

          if (error) {
            error.details.forEach((detail) => {
              errors.push({
                location: type,
                field: detail.path.join("."),
                message: detail.message.replace(/"/g, ""),
              });
            });
          }
        }
      });

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors,
        });
      }

      next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Validation middleware error",
      });
    }
  };
};
