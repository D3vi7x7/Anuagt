import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    userId: { type: String, required: true },
    msTaskId: { type: String, sparse: true, unique: true },
    status: { type: String, default: "pending" }
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);