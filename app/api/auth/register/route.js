import { connectDb } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export const POST = async (req) => {

    const { name, email, password } = await req.json();
    await connectDb();

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashed,
    });

    return Response.json(user);
}