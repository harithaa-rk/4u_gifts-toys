import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true,
    index: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    enum: [100, 250, 500, 1000] 
  },
  currency: { 
    type: String, 
    default: "INR" 
  },
  purchaserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  purchaserEmail: { 
    type: String, 
    trim: true 
  },
  recipientName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  recipientEmail: { 
    type: String, 
    required: true, 
    trim: true, 
    lowercase: true 
  },
  personalMessage: { 
    type: String, 
    default: "" 
  },
  paymentMethod: { 
    type: String, 
    default: "card" 
  },
  paymentStatus: { 
    type: String, 
    default: "Paid" 
  },
  status: { 
    type: String, 
    enum: ["active", "redeemed", "expired", "cancelled"], 
    default: "active" 
  },
  expiryDate: { 
    type: Date, 
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year validity
  },
  redeemedAt: { 
    type: Date 
  },
  redeemedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("Voucher", voucherSchema);
