import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number
    }
  ],
  totalAmount: Number,
  status: { type: String, default: "Pending" },
  paymentMethod: { type: String, default: "card" },
  paymentStatus: { type: String, default: "Pending" },
  paymentDetails: {
    utrNumber: { type: String, default: "" },
    upiApp: { type: String, default: "" },
    payerUpiId: { type: String, default: "" },
    referenceId: { type: String, default: "" },
    receiptUrl: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    verifiedByAdmin: { type: Boolean, default: false }
  },
  shippingAddress: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", orderSchema);