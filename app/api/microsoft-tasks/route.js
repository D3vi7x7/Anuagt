import { connectDb } from "@/lib/db";
import Task from "@/lib/models/Task";
import { verifyToken } from "@/lib/auth";

export const POST = async (req) => {
    await connectDb();

    const token = req.headers.get("authorization");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try {
        user = verifyToken(token);
    } catch (e) {
        return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const { accessToken } = await req.json();

    const listsRes = await fetch(
        "https://graph.microsoft.com/v1.0/me/todo/lists",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    const listsData = await listsRes.json();
    const listId = listsData.value?.[0]?.id;

    if (!listId) {
        return Response.json({ success: true, count: 0 });
    }

    const tasksRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    const tasksData = await tasksRes.json();

    if (tasksData.value && Array.isArray(tasksData.value)) {

        const pushToDB = tasksData.value.map(msTask => ({
            updateOne: {
                filter: { msTaskId: msTask.id, userId: user.id },
                update: {
                    $set: {
                        title: msTask.title,
                        msTaskId: msTask.id,
                        userId: user.id,
                        status: msTask.status === 'completed' ? 'completed' : 'pending'
                    }
                },
                upsert: true
            }
        }));

        if (pushToDB.length > 0) {
            await Task.bulkWrite(pushToDB);
        }
    }

    return Response.json({ success: true, count: tasksData.value?.length || 0 });
}
