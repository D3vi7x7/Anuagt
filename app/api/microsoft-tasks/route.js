export const POST = async (req) => {
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
    console.log("Lists Data:", listsData);

    const listId = listsData.value?.[0]?.id;

    if (!listId) {
        console.log("No List ID found, returning empty array.");
        return Response.json([]);
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

    return Response.json(tasksData.value);
}
