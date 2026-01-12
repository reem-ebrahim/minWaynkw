const mongoose = require("mongoose");

require('dotenv').config()

module.exports.connectdb = () => {
  return mongoose
    .connect(process.env.MONGOURL)
    .then(() => {
      console.log("done connect");
    })
    .catch((error) => {
      console.log("error connect", error);
    });
};
