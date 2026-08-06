import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");
    console.log("MongoDB URI:", process.env.MONGO_URI);
    console.log("Using DB:", mongoose.connection.name);
  } catch (error) {
    console.log("DB Error ❌", error);
    process.exit(1);
  }
};

export default connectDB;