import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
    title: String,
    userId: String,
});

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);