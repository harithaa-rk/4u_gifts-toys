import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  icon: String,
  color: String,
  subcategories: [String],
});

export default mongoose.model("Category", categorySchema);