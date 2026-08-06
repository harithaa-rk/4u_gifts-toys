import express from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

const router = express.Router();

// ─── Helper: Build a regex that matches any of the given keywords ───
const matchesAny = (text, keywords) =>
  keywords.some((kw) => text.includes(kw));

// ─── Helper: Format price for display ───
const fmtPrice = (p) => `₹${(+p).toLocaleString("en-IN")}`;

// ─── Helper: Pick a random element ───
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── FAQ knowledge base ───
const FAQ = {
  shipping: "We offer shipping across India! 🚚 Standard delivery takes 3-5 business days. Free shipping on orders above ₹999!",
  returns: "Easy returns within 7 days of delivery! 📦 Just contact us and we'll arrange a pickup.",
  payment: "We accept UPI, Credit/Debit cards, Net Banking, and Cash on Delivery! 💳",
  contact: "You can reach us at 4u.toyshop.2026@gmail.com or call us during business hours! 📞",
  timings: "We're open Monday to Saturday, 10 AM – 8 PM IST! 🕙",
  location: "We're an online store delivering across India! 🇮🇳 Visit our website anytime.",
};

// ─── Main chat handler ───
router.post("/", async (req, res) => {
  try {
    const userMsg = (req.body.message || "").toLowerCase().trim();

    if (!userMsg) {
      return res.json({
        reply: "Hmm, looks like an empty message! Try asking me something like \"Show me baby toys\" or \"Gifts under ₹500\" 😊",
        products: [],
      });
    }

    // ──────── 1. GREETINGS ────────
    if (matchesAny(userMsg, ["hi", "hello", "hey", "hola", "namaste", "good morning", "good evening", "good afternoon"])) {
      return res.json({
        reply: pick([
          "Hey there! 👋✨ Welcome to 4U Toys & Treats! I'm your shopping assistant. Ask me anything — product search, gift ideas, prices — I've got you covered!",
          "Hello! 🌸 I'm the 4U Toys assistant! I can help you find the perfect gift. Try asking me \"What baby toys do you have?\" or \"Show gifts under ₹500\"!",
          "Hi! 🎀 So glad you're here! I can search products, recommend gifts, and answer your questions. What are you looking for today?",
        ]),
        products: [],
        suggestions: ["Show popular products", "Gifts for baby", "What categories do you have?"],
      });
    }

    // ──────── 2. THANKS / BYE ────────
    if (matchesAny(userMsg, ["thank", "thanks", "bye", "goodbye", "see you"])) {
      return res.json({
        reply: pick([
          "You're welcome! 🎀 Happy shopping at 4U Toys & Treats! Come back anytime! 💕",
          "Glad I could help! 🌟 Wishing you a wonderful day! 🎈",
          "Bye bye! 👋 Don't forget — the perfect gift is just a message away! 🎁",
        ]),
        products: [],
      });
    }

    // ──────── 3. FAQ QUERIES ────────
    if (matchesAny(userMsg, ["shipping", "delivery", "deliver", "ship"])) {
      return res.json({ reply: FAQ.shipping, products: [] });
    }
    if (matchesAny(userMsg, ["return", "refund", "exchange"])) {
      return res.json({ reply: FAQ.returns, products: [] });
    }
    if (matchesAny(userMsg, ["payment", "pay", "upi", "cod", "cash on delivery"])) {
      return res.json({ reply: FAQ.payment, products: [] });
    }
    if (matchesAny(userMsg, ["contact", "email", "phone", "call", "reach"])) {
      return res.json({ reply: FAQ.contact, products: [] });
    }
    if (matchesAny(userMsg, ["timing", "hours", "open", "close", "time"])) {
      return res.json({ reply: FAQ.timings, products: [] });
    }
    if (matchesAny(userMsg, ["location", "address", "where", "store location"])) {
      return res.json({ reply: FAQ.location, products: [] });
    }

    // ──────── 4. PRODUCT COUNT ────────
    if (matchesAny(userMsg, ["how many product", "total product", "product count", "number of product"])) {
      const count = await Product.countDocuments({ status: { $in: ["active", "low_stock"] } });
      return res.json({
        reply: `We currently have **${count} products** in our store! 🎉 Would you like to browse them?`,
        products: [],
        suggestions: ["Show all products", "Show categories"],
      });
    }

    // ──────── 5. CATEGORY LIST ────────
    if (matchesAny(userMsg, ["categor", "what type", "what kind", "sections"])) {
      const categories = await Category.find();
      if (categories.length === 0) {
        return res.json({ reply: "We're still setting up our categories! Check back soon 🛠️", products: [] });
      }
      const list = categories.map((c) => `${c.icon || "🏷️"} **${c.label}**`).join("\n");
      return res.json({
        reply: `Here are our categories:\n\n${list}\n\nWhich one interests you? 😊`,
        products: [],
        suggestions: categories.slice(0, 3).map((c) => `Show ${c.label} products`),
      });
    }

    // ──────── 6. PRICE-BASED SEARCH ────────
    const priceMatch = userMsg.match(/(?:under|below|less than|within|upto|up to|max)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i)
      || userMsg.match(/(?:₹|rs\.?|inr)\s*(\d+)/i);

    if (priceMatch) {
      const maxPrice = parseInt(priceMatch[1]);
      const products = await Product.find({
        status: { $in: ["active", "low_stock"] },
        price: { $lte: maxPrice },
      })
        .sort({ price: -1 })
        .limit(6);

      if (products.length === 0) {
        return res.json({
          reply: `Sorry, I couldn't find any products under ${fmtPrice(maxPrice)} right now. 😔 Try a higher budget?`,
          products: [],
          suggestions: ["Gifts under ₹1000", "Show all products"],
        });
      }

      return res.json({
        reply: `Here are some great picks under ${fmtPrice(maxPrice)}! 🎁✨`,
        products: products.map((p) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          category: p.category,
          image: p.images?.[0] || null,
        })),
      });
    }

    // ──────── 7. CHEAPEST / EXPENSIVE ────────
    if (matchesAny(userMsg, ["cheapest", "lowest price", "most affordable", "budget"])) {
      const products = await Product.find({ status: { $in: ["active", "low_stock"] } })
        .sort({ price: 1 })
        .limit(5);
      return res.json({
        reply: "Here are our most budget-friendly products! 💰🎉",
        products: products.map((p) => ({
          _id: p._id, name: p.name, price: p.price, category: p.category, image: p.images?.[0] || null,
        })),
      });
    }

    if (matchesAny(userMsg, ["expensive", "premium", "luxury", "highest price", "costly"])) {
      const products = await Product.find({ status: { $in: ["active", "low_stock"] } })
        .sort({ price: -1 })
        .limit(5);
      return res.json({
        reply: "Here are our premium picks! ✨💎",
        products: products.map((p) => ({
          _id: p._id, name: p.name, price: p.price, category: p.category, image: p.images?.[0] || null,
        })),
      });
    }

    // ──────── 8. POPULAR / RECOMMENDED / NEW ────────
    if (matchesAny(userMsg, ["popular", "best sell", "trending", "recommend", "suggest", "top", "best", "new", "latest", "recent"])) {
      const products = await Product.find({ status: { $in: ["active", "low_stock"] } })
        .sort({ createdAt: -1 })
        .limit(5);
      return res.json({
        reply: "Here are our top picks just for you! 🌟🛍️",
        products: products.map((p) => ({
          _id: p._id, name: p.name, price: p.price, category: p.category, image: p.images?.[0] || null,
        })),
      });
    }

    // ──────── 9. GIFT RECOMMENDATION by recipient ────────
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach((c) => {
      categoryMap[c.id] = c;
      categoryMap[c.label.toLowerCase()] = c;
    });

    // Try matching a category name from the user message
    let matchedCategory = null;
    for (const cat of categories) {
      const lbl = cat.label.toLowerCase();
      if (userMsg.includes(lbl) || userMsg.includes(cat.id)) {
        matchedCategory = cat;
        break;
      }
    }

    // Check for recipient keywords
    if (!matchedCategory) {
      if (matchesAny(userMsg, ["baby", "infant", "toddler", "kid", "child", "children"])) {
        matchedCategory = categories.find((c) => c.label.toLowerCase().includes("baby") || c.id.includes("baby"));
      } else if (matchesAny(userMsg, ["mom", "mother", "mommy", "mummy", "mama"])) {
        matchedCategory = categories.find((c) => c.label.toLowerCase().includes("mom") || c.id.includes("mom"));
      } else if (matchesAny(userMsg, ["dad", "father", "papa", "daddy"])) {
        matchedCategory = categories.find((c) => c.label.toLowerCase().includes("father") || c.label.toLowerCase().includes("dad") || c.id.includes("father"));
      } else if (matchesAny(userMsg, ["fancy", "fashion", "accessory", "accessories"])) {
        matchedCategory = categories.find((c) => c.label.toLowerCase().includes("fancy") || c.id.includes("fancy"));
      }
    }

    if (matchedCategory) {
      const products = await Product.find({
        status: { $in: ["active", "low_stock"] },
        category: matchedCategory.id,
      }).limit(6);

      if (products.length === 0) {
        return res.json({
          reply: `We don't have any ${matchedCategory.label} products in stock right now, but check back soon! 🔜`,
          products: [],
        });
      }

      return res.json({
        reply: `${matchedCategory.icon || "🎁"} Here are our **${matchedCategory.label}** products:`,
        products: products.map((p) => ({
          _id: p._id, name: p.name, price: p.price, category: p.category, image: p.images?.[0] || null,
        })),
      });
    }

    // ──────── 10. GENERIC PRODUCT SEARCH ────────
    // Search by product name, description, tags, brand
    const searchRegex = new RegExp(userMsg.split(/\s+/).filter(w => w.length > 2).join("|"), "i");
    const searchResults = await Product.find({
      status: { $in: ["active", "low_stock"] },
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { brand: searchRegex },
      ],
    }).limit(6);

    if (searchResults.length > 0) {
      return res.json({
        reply: `I found ${searchResults.length} product${searchResults.length > 1 ? "s" : ""} matching your query! 🔍✨`,
        products: searchResults.map((p) => ({
          _id: p._id, name: p.name, price: p.price, category: p.category, image: p.images?.[0] || null,
        })),
      });
    }

    // ──────── 11. SHOW ALL ────────
    if (matchesAny(userMsg, ["show all", "all product", "everything", "show me all", "list all"])) {
      const products = await Product.find({ status: { $in: ["active", "low_stock"] } }).limit(8);
      return res.json({
        reply: "Here's a selection from our collection! 🛍️",
        products: products.map((p) => ({
          _id: p._id, name: p.name, price: p.price, category: p.category, image: p.images?.[0] || null,
        })),
      });
    }

    // ──────── 12. FALLBACK ────────
    return res.json({
      reply: pick([
        "Hmm, I'm not sure I understood that 🤔 Try asking me about products, categories, prices, or gift ideas!",
        "I didn't quite catch that! 💭 You can ask me things like \"Show baby toys\" or \"Gifts under ₹500\"",
        "I'm still learning! 🌱 Try questions like \"What categories do you have?\" or \"Show me popular products\"",
      ]),
      products: [],
      suggestions: ["Show popular products", "What categories do you have?", "Gifts under ₹500"],
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({
      reply: "Oops, something went wrong on my end! 😥 Please try again in a moment.",
      products: [],
    });
  }
});

export default router;
