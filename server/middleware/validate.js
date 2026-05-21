const { validationResult } = require('express-validator');

// Run after express-validator chains – returns 422 if any errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
      errors:  errors.array(),
    });
  }
  next();
};

module.exports = { validate };
