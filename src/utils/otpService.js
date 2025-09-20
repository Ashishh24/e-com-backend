const OTP = require("../models/OTP");
const transporter = require("./emailService");

async function verifyOTP(email, otp) {
  const record = await OTP.findOne({ email, otp });
  if (!record) return false;

  if (record.expiresAt < Date.now()) {
    await OTP.deleteOne({ _id: record._id });
    return false;
  }

  // OTP is valid → remove it
  await OTP.deleteOne({ _id: record._id });
  return true;
}

async function sendOTPForEmailVerification(email) {
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in DB (5 min expiry)
  await OTP.findOneAndUpdate(
    { email },
    {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
    },
    { upsert: true, new: true } // create if not exists, return new doc
  );

  // Send Email
  await transporter.sendMail({
    from: `"GLOWISHII" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Email Verification OTP",
    html: `
            <h1>Verify Your Email</h1>
            <p>Your OTP is:</p>
            <h2>${otp}</h2>
            <p>This OTP will expire in 5 minutes.</p>
        `,
  });
}

module.exports = { verifyOTP, sendOTPForEmailVerification };
