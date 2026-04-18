import { signToken } from "@/lib/auth";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";


export const POST = async (req) => {

    const [email, password] = await req.json();

    await connectDb();

    const user = await User.findOne({ email });
    if (!user) return Response.json({ error: "Invalid email or password" }, { status: 401 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return Response.json({ error: "Invalid email or password" }, { status: 401 });

    const token = signToken(user);
    return Response.json({ token });
}