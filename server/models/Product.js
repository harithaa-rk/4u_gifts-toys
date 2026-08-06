import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },

  category: { type: String, required: true },

  subcategory: { type: String },

  price: { type: Number, required: true },

  quantity: { type: Number, required: true },

  description: { type: String },

  ageGroup: { type: String },

  brand: { type: String },

  sku: { type: String },

  weight: { type: String },

  status: { type: String, default: "active" },

  tags: [{ type: String }],

  // Product Images
  images: [{ type: String }],

  // NEW FIELD FOR AR/VR
  model3d: { type: String },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Product", productSchema);