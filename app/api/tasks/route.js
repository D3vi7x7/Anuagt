import { connectDb } from "@/lib/db";
import Task from "@/lib/models/Task";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
    await connectDb();

    const token = req.headers.get("authorization");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try {
        user = verifyToken(token);
    } catch {
        return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const tasks = await Task.find({ userId: user.id }).sort({ createdAt: -1 });
    return Response.json(tasks);
}

export async function POST(req) {
    await connectDb();

    const token = req.headers.get("authorization");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try {
        user = verifyToken(token);
    } catch {
        return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const { title, msToken } = await req.json();

    let msTaskId = undefined;

    // Post to Microsoft To Do if token is provided
    if (msToken) {
        try {
            const listsRes = await fetch("https://graph.microsoft.com/v1.0/me/todo/lists", {
                 headers: { Authorization: `Bearer ${msToken}` }
            });
            const listsData = await listsRes.json();
            const listId = listsData.value?.[0]?.id;

            if (listId) {
                const msTaskRes = await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${msToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title })
                });
                const newMsTask = await msTaskRes.json();
                if (newMsTask.id) {
                    msTaskId = newMsTask.id;
                }
            }
        } catch (e) {
            console.error("Error pushing to MS Todo:", e);
        }
    }

    const task = await Task.create({
        title,
        userId: user.id,
        msTaskId,
        status: "pending"
    });

    return Response.json(task);
}