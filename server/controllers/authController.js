import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 🔹 REGISTER API
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate OTP and expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires
    });

    console.log("[DEBUG] About to save user to DB:", user);
    try {
      await user.save();
      console.log("[DEBUG] User saved to DB:", user);
    } catch (saveErr) {
      console.error("[ERROR] Failed to save user:", saveErr);
      return res.status(500).json({ message: "Failed to save user", error: saveErr.message });
    }

    // Send OTP email
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Hello ${name}, your OTP is: ${otp}`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check expiry
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // OTP verified → remove OTP and mark as verified
    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;
    await user.save();

    res.json({ message: "OTP verified successfully ✅" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 LOGIN API
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 VERIFY ME — validate token on client startup
export const verifyMe = (req, res) => {
  // verifyToken middleware already rejected invalid tokens
  res.json({ valid: true });
};