import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,
  phone: String,
role: { type: String, default: "customer" },
});


export default mongoose.model("User", userSchema);