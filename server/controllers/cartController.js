import Cart from "../models/Cart.js";

export const addToCart = async (req, res) => {
  const { userId, productId } = req.body;

  const existing = await Cart.findOne({ userId, productId });

  if (existing) {
    existing.quantity += 1;
    await existing.save();
    return res.json(existing);
  }

  const cartItem = new Cart({ userId, productId });
  await cartItem.save();

  res.json(cartItem);
};

export const getCart = async (req, res) => {
  const cart = await Cart.find({ userId: req.params.userId }).populate("productId");
  res.json(cart);
};

export const removeFromCart = async (req, res) => {
  await Cart.findByIdAndDelete(req.params.id);
  res.json("Removed");
};