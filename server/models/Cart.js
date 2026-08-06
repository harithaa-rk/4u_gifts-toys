import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  oldPrice: Number,
  image: String,
  category: String,
  description: String,
});

export default mongoose.model("Product", productSchema);