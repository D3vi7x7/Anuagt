import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: {
        type: String,
        default: "user",
    },
});

delete mongoose.models.User;
export default mongoose.model("User", UserSchema);