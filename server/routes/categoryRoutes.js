import express from "express";
import Category from "../models/Category.js";

const router = express.Router();

// GET categories
router.get("/", async (req, res) => {
  try {
    const data = await Category.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD category
router.post("/", async (req, res) => {
  try {
    const { label, icon, color, subcategories } = req.body;

    // ⭐ generate unique id
    const id = label.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();

    const cat = new Category({
      id,
      label,
      icon,
      color,
      subcategories,
    });

    await cat.save();
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE category
router.delete("/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;