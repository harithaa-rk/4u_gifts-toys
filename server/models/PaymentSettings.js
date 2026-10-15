import mongoose from "mongoose";

const paymentSettingsSchema = new mongoose.Schema({
  upiId: { 
    type: String, 
    default: "haritha610kumar@okicici" 
  },
  payeeName: { 
    type: String, 
    default: "Haritha Kumar" 
  },
  qrImageUrl: {
    type: String,
    default: "/admin_upi_qr.jpg"
  },
  gpayPhone: { 
    type: String, 
    default: "+91 98765 43210" 
  },
  bankName: { 
    type: String, 
    default: "State Bank of India" 
  },
  accountNumber: { 
    type: String, 
    default: "409283719283" 
  },
  ifscCode: { 
    type: String, 
    default: "SBIN0004021" 
  },
  accountHolderName: { 
    type: String, 
    default: "4U Toys and Gifts Private Limited" 
  },
  branch: { 
    type: String, 
    default: "Coimbatore Main Branch" 
  },
  instructions: { 
    type: String, 
    default: "Please enter your 12-digit UPI / Bank Transfer Reference Number (UTR) after sending payment to complete verification." 
  },
  isRealTimeActive: { 
    type: Boolean, 
    default: true 
  },
  razorpayKeyId: {
    type: String,
    default: "rzp_test_4uStoreDemo123"
  },
  razorpayKeySecret: {
    type: String,
    default: ""
  },
  razorpayEnabled: {
    type: Boolean,
    default: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("PaymentSettings", paymentSettingsSchema);
