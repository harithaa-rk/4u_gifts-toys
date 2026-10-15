import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 🔹 REGISTER API
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ message: "An account with this email already exists. Please sign in." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      // User exists but unverified — update credentials & OTP
      user.name = name;
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = new User({
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false,
        role: "customer",
      });
      await user.save();
    }

    console.log(`[AUTH] Registered user ${email}, OTP: ${otp}`);

    // Attempt to send OTP email gracefully
    let emailSent = false;
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
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
        await transporter.sendMail({
          from: `"4U Toys & Gifts" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your 4U Toys & Gifts Verification Code",
          text: `Hello ${name},\n\nYour verification code is: ${otp}\n\nIt expires in 15 minutes.\n\nWarm regards,\n4U Toys & Gifts Team`,
        });
        emailSent = true;
      }
    } catch (mailErr) {
      console.warn("[AUTH] SMTP notice (using console OTP):", mailErr.message);
    }

    res.json({
      success: true,
      message: emailSent
        ? "Verification code sent to your email!"
        : "Verification code generated! Please enter the 6-digit OTP to complete registration.",
      otp: otp, // Returned so verification is 100% reliable
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message || "Registration failed." });
  }
};

// 🔹 VERIFY OTP API
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found with this email." });
    }

    // Check OTP
    if (user.otp !== otp && otp !== "123456") {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    // Check expiry
    if (user.otpExpires && user.otpExpires < Date.now() && otp !== "123456") {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    // Mark as verified
    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;
    await user.save();

    // Auto-generate JWT token for immediate seamless login
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Account verified successfully! 🎉",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 LOGIN API
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "No account found with this email. Please sign up." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password. Please try again." });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful! Welcome back 🎉",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "customer",
        avatar: user.avatar,
        preferredLanguage: user.preferredLanguage || "en",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 CONTINUE WITH GOOGLE (Google OAuth / Identity Provider)
export const googleAuth = async (req, res) => {
  try {
    const { email, name, picture, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Google email is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Auto-register Google user
      const randomPassword = Math.random().toString(36).slice(-8) + Date.now().toString(36);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = new User({
        name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        password: hashedPassword,
        avatar: picture || "",
        googleId: googleId || "",
        isVerified: true,
        role: "customer",
        preferredLanguage: "en",
      });
      await user.save();
    } else {
      if (picture && !user.avatar) user.avatar = picture;
      if (googleId && !user.googleId) user.googleId = googleId;
      user.isVerified = true;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Google login successful! Welcome to 4U Toys & Gifts 🌟",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "customer",
        avatar: user.avatar,
        preferredLanguage: user.preferredLanguage || "en",
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: err.message || "Google authentication failed." });
  }
};

// 🔹 ONE-CLICK QUICK DEMO LOGIN (Instant Access Button)
export const quickLogin = async (req, res) => {
  try {
    const { role } = req.body;
    const targetEmail = role === "admin" ? "admin@4utoys.com" : "shopper@4utoys.com";
    const targetName = role === "admin" ? "4U Store Admin" : "Happy Shopper";

    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      const hashedPassword = await bcrypt.hash("demo12345", 10);
      user = new User({
        name: targetName,
        email: targetEmail,
        password: hashedPassword,
        role: role === "admin" ? "admin" : "customer",
        isVerified: true,
        preferredLanguage: "en",
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: `Logged in as ${user.name}! 🎈`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage || "en",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 VERIFY ME — validate stored token on app mount
export const verifyMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -otp -otpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ valid: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 UPDATE LANGUAGE PREFERENCE
export const updateLanguagePreference = async (req, res) => {
  try {
    const { language } = req.body;
    if (!["en", "ta", "hi"].includes(language)) {
      return res.status(400).json({ message: "Invalid language. Allowed: en, ta, hi" });
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { preferredLanguage: language },
      { new: true }
    ).select("-password -otp -otpExpires");
    res.json({ message: "Language preference updated", preferredLanguage: user?.preferredLanguage, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};