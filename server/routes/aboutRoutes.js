import express from "express";
import About from "../models/About.js";

const router = express.Router();

// Get About Info
router.get("/", async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = await About.create({});
    }
    res.json(about);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Update About Info
router.put("/", async (req, res) => {
  try {
    const { description, images, stats } = req.body;
    let about = await About.findOne();
    
    if (about) {
      about.description = description !== undefined ? description : about.description;
      about.images = images !== undefined ? images : about.images;
      about.stats = stats !== undefined ? stats : about.stats;
      await about.save();
    } else {
      about = await About.create({ description, images, stats });
    }
    
    res.json(about);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

export default router;
