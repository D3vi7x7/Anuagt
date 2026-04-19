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

    const { title, msToken, dueDate } = await req.json();

    let msError = null;
    let msTaskId = undefined;

    // Post to Microsoft To Do if token is provided
    if (msToken) {
        try {
            const listsRes = await fetch("https://graph.microsoft.com/v1.0/me/todo/lists", {
                headers: { Authorization: `Bearer ${msToken}` }
            });
            if (!listsRes.ok) {
                msError = await listsRes.text();
                console.error("Microsoft ToDo List Fetch Error:", msError);
            } else {
                const listsData = await listsRes.json();

                // Find the default list instead of blindly taking the first one
                const defaultList = listsData.value?.find(list => list.wellKnownName === 'defaultList');
                const listId = defaultList?.id || listsData.value?.[0]?.id;

                if (listId) {
                    let msPayload = {
                        title,
                        isOnMyDay: true
                    };

                    if (dueDate) {
                        const dt = new Date(dueDate);
                        // Microsoft Graph API requires dateTime in YYYY-MM-DDTHH:MM:SS format
                        msPayload.dueDateTime = {
                            dateTime: dt.toISOString().split('.')[0],
                            timeZone: "UTC"
                        };
                    }

                    const msTaskRes = await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${msToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(msPayload)
                    });

                    if (!msTaskRes.ok) {
                        msError = await msTaskRes.text();
                        console.error("Microsoft ToDo Task Create Error:", msError);
                    } else {
                        const newMsTask = await msTaskRes.json();
                        if (newMsTask.id) {
                            msTaskId = newMsTask.id;
                        }
                    }
                } else {
                    msError = "No Microsoft To Do list found for the user.";
                }
            }
        } catch (e) {
            console.error("Error pushing to MS Todo:", e);
            msError = e.message;
        }
    }

    const task = await Task.create({
        title,
        userId: user.id,
        msTaskId,
        status: "pending",
        dueDate: dueDate ? new Date(dueDate) : undefined
    });

    return Response.json({ ...task.toObject(), msError });
}