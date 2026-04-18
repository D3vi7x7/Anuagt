import { connectDb } from "@/lib/db";
import Task from "@/lib/models/Task";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
    await connectDb();

    const token = req.headers.get("authorization");
    const user = verifyToken(token);

    const tasks = await Task.find({ userId: user.id });

    return Response.json(tasks);
}

export async function POST(req) {
    await connectDB();

    const token = req.headers.get("authorization");
    const user = verifyToken(token);

    const { title } = await req.json();

    const task = await Task.create({
        title,
        userId: user.id,
    });

    return Response.json(task);
}