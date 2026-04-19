import { connectDb } from "@/lib/db";
import Task from "@/lib/models/Task";
import { verifyToken } from "@/lib/auth";

const syncMsTodo = async (task, msToken, action, newStatus = null) => {
    if (!task.msTaskId || !msToken) return;
    try {
        const listsRes = await fetch("https://graph.microsoft.com/v1.0/me/todo/lists", {
            headers: { Authorization: `Bearer ${msToken}` }
        });
        const listsData = await listsRes.json();
        const listId = listsData.value?.[0]?.id;
        
        if (listId) {
            if (action === "DELETE") {
                await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks/${task.msTaskId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${msToken}` }
                });
            } else if (action === "PATCH") {
                await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks/${task.msTaskId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${msToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus === 'completed' ? 'completed' : 'notStarted' })
                });
            }
        }
    } catch (e) {
        console.error("Error syncing to MS Todo:", e);
    }
};

export async function PATCH(req, props) {
    const params = await props.params;
    await connectDb();

    const token = req.headers.get("authorization");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try {
        user = verifyToken(token);
    } catch {
        return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, msToken } = body;

    const task = await Task.findOne({ _id: id, userId: user.id });
    if (!task) return Response.json({ error: "Task not found" }, { status: 404 });

    if (status === "completed") {
        const createdAt = new Date(task.createdAt);
        const now = new Date();
        const diffMs = now - createdAt;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours >= 24) {
            await Task.deleteOne({ _id: id });
            // For MS To Do, we mark it complete instead of hard deleting it so they keep their history
            await syncMsTodo(task, msToken, "PATCH", "completed");
            return Response.json({ message: "Task completed and deleted locally (older than 24h)", deleted: true });
        }
    }

    task.status = status;
    await task.save();
    await syncMsTodo(task, msToken, "PATCH", status);

    return Response.json({ message: "Task updated successfully", task, deleted: false });
}

export async function DELETE(req, props) {
    const params = await props.params;
    await connectDb();

    const token = req.headers.get("authorization");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try {
        user = verifyToken(token);
    } catch {
        return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = params;
    
    // We parse query params to get msToken if sent via URL or body (for DELETE, typically body or headers, let's just grab from request body if any, or URL)
    let msToken = null;
    try {
        const body = await req.json();
        msToken = body.msToken;
    } catch (e) {
        // body might be empty for DELETE
    }

    const task = await Task.findOne({ _id: id, userId: user.id });
    if (task) {
        await Task.deleteOne({ _id: id });
        if (msToken) {
            await syncMsTodo(task, msToken, "DELETE");
        }
    }
    
    return Response.json({ message: "Task deleted" });
}
