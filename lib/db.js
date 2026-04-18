import mongoose from "mongoose";

export const connectDb = async () => {
    if (mongoose.connections[0].readyState === 1) return;

    await mongoose.connect(process.env.MONGO_URI);
}