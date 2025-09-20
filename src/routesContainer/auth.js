const express = require("express");
const User = require("../models/user");
const { validateSignupData } = require("../utils/validation");
const { sendOTPForEmailVerification } = require("../utils/otpService");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const errors = validateSignupData(req);
    if (errors.length > 0) {
      return res.status(406).json({ errors });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw { message: "Email already registered", statusCode: 400 };
    }

    const user = new User({ name, email, password });
    await user.save();

    await sendOTPForEmailVerification(email);

    res.status(201).json({
      message: "User registered. Please verify your email with the OTP sent.",
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors)
        .map((e) => e.message)
        .join(" | ");

      return res.status(400).json({ message: messages });
    }
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const isUser = await User.findOne({ email: email });

    if (!isUser) {
      throw { message: "Invalid email!!", statusCode: 404 };
    }

    if (!isUser.verified) {
      throw { message: "Please verify your email first!!", statusCode: 403 };
    }

    const isPasswordValid = await isUser.matchPassword(password);
    if (!isPasswordValid) {
      throw { message: "Invalid password!!", statusCode: 403 };
    } else {
      const token = isUser.getJWT();
      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 24 * 3600000),
      });
      res.json({ token, user: isUser });
    }
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
});

authRouter.post("/otp/send", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
      throw { message: "Email not exist", statusCode: 404 };
    }

    if (user.verified === false) {
      await sendOTPForEmailVerification(email);
      res.json({ message: "OTP sent successfully!" });
    }
    res.status(200).json({ message: "User already verified" });
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
});

authRouter.post("/otp/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw { message: "Email and OTP are required", statusCode: 400 };
    }

    const isValid = await verifyOTP(email, otp);
    if (!isValid) {
      throw { message: "Invalid OTP", statusCode: 401 };
    }

    await User.findOneAndUpdate({ email }, { verified: true });

    res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Logout Successful!!");
});

module.exports = authRouter;
