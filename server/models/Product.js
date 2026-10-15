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

  // Optional original/reference price for discounts
  originalPrice: { type: Number },

  // Variants (Colors, Sizes, Styles, Packs)
  variants: [
    {
      name: { type: String }, // e.g. "Color", "Size", "Style"
      options: [{ type: String }], // e.g. ["Pink", "Lavender", "Sky Blue"]
      optionImages: { type: Map, of: String },
      priceDelta: { type: Number, default: 0 },
      stock: { type: Number },
      sku: { type: String },
    }
  ],

  // Structured specifications
  specifications: [
    {
      key: { type: String },
      value: { type: String }
    }
  ],

  // Ratings calculation
  averageRating: { type: Number, default: 5.0 },
  ratingCount: { type: Number, default: 0 },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Product", productSchema);