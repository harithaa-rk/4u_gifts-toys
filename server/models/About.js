import mongoose from "mongoose";

const aboutSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      default: "Welcome to our shop! We provide the best toys and treats.",
    },
    images: {
      type: [String],
      default: [],
    },
    stats: [
      {
        label: { type: String, required: true },
        value: { type: Number, required: true },
        suffix: { type: String, default: "" }, // e.g. "+" or "%"
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("About", aboutSchema);
