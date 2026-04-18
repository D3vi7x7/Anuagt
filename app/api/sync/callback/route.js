export const GET = async (req) => {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    const tokenRes = await fetch(
        `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.MICROSOFT_CLIENT_ID,
                client_secret: process.env.MICROSOFT_CLIENT_SECRET,
                code,
                redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/sync/callback`,
                scope: "Tasks.ReadWrite",
                grant_type: "authorization_code",
            }),
        }
    );

    const data = await tokenRes.json();
    console.log("Microsoft Token Response:", data);

    const accessToken = data.access_token;

    return Response.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?token=${accessToken}`
    );
}