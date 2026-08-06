import express from "express";
import Product from "../models/Product.js";
import upload from "../middleware/uploadMiddleware.js";
import uploadModel3d from "../middleware/uploadModel3dMiddleware.js";

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const data = await Product.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD product (with image upload)
router.post(
  "/",
  upload.array("images", 5),
  async (req, res) => {
    try {
      const imageUrls = req.files?.map((file) => file.path) || [];
      const product = new Product({
        ...req.body,
        images: imageUrls,
      });
      await product.save();
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// UPDATE product (general fields, JSON body — no file upload)
router.put("/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPLOAD 3D MODEL for a product (.glb / .usdz via Cloudinary raw)
router.patch(
  "/:id/model3d",
  uploadModel3d.single("model3d"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No 3D model file uploaded" });
      }

      // Cloudinary raw URL (works for model-viewer src)
      const modelUrl = req.file.path;

      const updated = await Product.findByIdAndUpdate(
        req.params.id,
        { model3d: modelUrl },
        { new: true }
      );

      if (!updated) return res.status(404).json({ error: "Product not found" });
      res.json({ model3d: updated.model3d, product: updated });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// REMOVE 3D model from a product
router.delete("/:id/model3d", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $unset: { model3d: "" } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "3D model removed", product: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;