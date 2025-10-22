const mongoose = require("mongoose");
var validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: [2, "Name must be at least 2 characters long."],
    maxLength: 50,
    trim: true,
  },
  street: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  pincode: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return /^\d{6}$/.test(v);
      },
      message: "Invalid Indian pincode",
    },
  },
  country: {
    type: String,
    trim: true,
    default: "India",
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(\+91)?[6-9]\d{9}$/.test(v);
      },
      message: "Invalid phone number",
    },
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: [2, "Name must be at least 2 characters long."],
      maxLength: 50,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email Already Exist!!"],
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: "Invalid email format",
      },
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator: (value) =>
          validator.isStrongPassword(value, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          }),
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol",
      },
    },
    verified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return /^(\+91)?[6-9]\d{9}$/.test(v);
        },
        message: "Invalid Indian phone number format",
      },
    },
    address: [addressSchema],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    cart: {
      cartTotal: { type: Number, default: 0 },
      items: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
          quantity: { type: Number, default: 1, min: 1 },
          itemsTotal: { type: Number, default: 0 },
        },
      ],
    },
    isAdmin: {
      type: Boolean,
      deafult: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(
      this.password,
      parseInt(process.env.PASS_HASH_SALT)
    );
  }

  next();
});

userSchema.methods.getJWT = function () {
  const user = this;
  const jwtToken = jwt.sign({ _id: user._id }, process.env.JWT_KEY, {
    expiresIn: "30d",
  });
  return jwtToken;
};

userSchema.methods.matchPassword = async function (passwordByUserInput) {
  const user = this;
  const passowrdHash = user.password;
  const isPasswordValid = await bcrypt.compare(
    passwordByUserInput,
    passowrdHash
  );
  return isPasswordValid;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
