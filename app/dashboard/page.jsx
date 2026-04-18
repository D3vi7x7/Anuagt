"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");

    const role =
        typeof window !== "undefined" ? localStorage.getItem("role") : null;

    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const hasData = tasks.length > 0;

    const fetchTasks = async () => {
        const res = await fetch("/api/tasks", {
            headers: { authorization: token },
        });
        const data = await res.json();
        setTasks(data);
    };

    const addTask = async () => {
        if (!title) return;

        await fetch("/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authorization: token,
            },
            body: JSON.stringify({ title }),
        });

        setTitle("");
        fetchTasks();
    };

    const loginWithMicrosoft = () => {
        const url = `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_TENANT_ID}/oauth2/v2.0/authorize?client_id=${process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/api/sync/callback&scope=Tasks.Read&prompt=select_account`;

        window.location.href = url;
    };

    useEffect(() => {
        fetchTasks();

        const params = new URLSearchParams(window.location.search);
        const msToken = params.get("token");

        if (msToken) syncMicrosoft(msToken);
    }, []);

    const syncMicrosoft = async (msToken) => {
        const res = await fetch("/api/sync", {
            method: "POST",
            body: JSON.stringify({ accessToken: msToken }),
        });

        const data = await res.json();

        const formatted = data.map((t) => ({
            title: t.title,
            _id: t.id,
        }));

        setTasks((prev) => [...prev, ...formatted]);
    };

    //Some examples
    const meetings = hasData
        ? [{ title: "Professor Meet", time: "2:30 PM" }]
        : [];

    const quizzes = hasData
        ? [{ title: "Math Quiz", time: "11:30 AM" }]
        : [];

    const invigilation = hasData
        ? [{ room: "Room 101", time: "9:00 AM" }]
        : [];

    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* SIDEBAR */}
            <div className="w-64 bg-white shadow p-4 space-y-4">
                <h2 className="text-xl font-bold">Anugat AI</h2>

                <div className="space-y-2">
                    <Button className="w-full">Home</Button>
                    <Button variant="ghost" className="w-full">Class Timetable</Button>
                    <Button variant="ghost" className="w-full">Invigilator Task</Button>
                    <Button variant="ghost" className="w-full">Requests</Button>
                </div>

                <Button className="mt-10 w-full bg-black text-white">
                    Logout
                </Button>
            </div>

            {/* MAIN */}
            <div className="flex-1 p-6 space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <Input placeholder="Search..." className="w-1/3" />
                    <div className="flex gap-2">
                        <Button variant="outline">🔔</Button>
                        <Button variant="outline">👤</Button>
                    </div>
                </div>

                {/* WELCOME CARD */}
                <Card className="bg-blue-500 text-white">
                    <CardContent className="p-6">
                        <h1 className="text-2xl font-bold">
                            Welcome User!
                        </h1>
                        <p className="text-sm">
                            Manage your tasks and schedule efficiently
                        </p>
                    </CardContent>
                </Card>

                {/* MAIN GRID */}
                <div className="grid grid-cols-3 gap-6">

                    {/* LEFT SECTION */}
                    <div className="col-span-2 space-y-6">

                        {/* TODAY ENGAGEMENT */}
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <h2 className="font-semibold">Today's Engagement</h2>

                                {hasData ? (
                                    <>
                                        <p>10:00 AM - Faculty Meeting</p>
                                        <p>4:00 PM - Extra Class</p>
                                    </>
                                ) : (
                                    <p className="text-gray-500">
                                        No engagements scheduled today.
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <Button>Weekly Schedule</Button>
                                    <Button variant="secondary">Share</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* QUIZ + MEETING */}
                        <div className="grid grid-cols-2 gap-4">

                            <Card>
                                <CardContent className="p-4">
                                    <h3 className="font-semibold">Quiz Scheduler</h3>

                                    {quizzes.length > 0 ? (
                                        quizzes.map((q, i) => (
                                            <p key={i}>{q.title}</p>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">No quizzes scheduled</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <h3 className="font-semibold">Meetings</h3>

                                    {meetings.length > 0 ? (
                                        meetings.map((m, i) => (
                                            <p key={i}>{m.title}</p>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">No meetings scheduled</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* RIGHT SECTION */}
                    <div className="space-y-6">

                        {/* TASKS */}
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                <h2 className="font-semibold">Today's Focus</h2>

                                <div className="flex gap-2">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Add task"
                                    />
                                    <Button onClick={addTask}>Add</Button>
                                </div>

                                <Button onClick={loginWithMicrosoft}>
                                    Sync with Microsoft
                                </Button>

                                {tasks.length > 0 ? (
                                    tasks.map((t) => (
                                        <p key={t._id}>• {t.title}</p>
                                    ))
                                ) : (
                                    <p className="text-gray-500">
                                        No tasks found. Sync or add manually.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* ROLE BASED */}
                        {role === "admin" && (
                            <Card>
                                <CardContent className="p-4">
                                    <h2 className="font-semibold">
                                        Invigilation Duty
                                    </h2>

                                    {invigilation.length > 0 ? (
                                        invigilation.map((i, idx) => (
                                            <p key={idx}>
                                                {i.room} - {i.time}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">
                                            No duties assigned
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}