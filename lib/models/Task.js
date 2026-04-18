import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
    title: String,
    userId: String,
});

export default mongoose.model("Task", TaskSchema);