module.exports = (req, res, next) => {
  res.success = (message, data = null, status = 200) => {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  };

  res.error = (message, errors = null, status = 400) => {
    return res.status(status).json({
      success: false,
      message,
      errors,
    });
  };

  next();
};