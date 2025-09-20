const mongoose = require("mongoose");

const pincodeSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{6}$/.test(v); // exactly 6 digits
      },
      message: "Invalid Indian pincode",
    },
  },
  delivery: {
    type: String,
    required: true,
    enum: ["Delivery", "Non Delivery"],
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
});

const Pincode = mongoose.model("Pincode", pincodeSchema);

module.exports = Pincode;
