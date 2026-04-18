"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Plus, User, Bell, Calendar, Home, ClipboardList, LogOut } from "lucide-react";

export default function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [msToken, setMsToken] = useState(null);
    const router = useRouter();

    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/");
            return;
        }

        let currentMsToken = localStorage.getItem("msToken");

        const params = new URLSearchParams(window.location.search);
        const urlMsToken = params.get("token");

        if (urlMsToken) {
            currentMsToken = urlMsToken;
            localStorage.setItem("msToken", urlMsToken);
            setMsToken(urlMsToken);
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            syncMicrosoft(urlMsToken);
        } else if (currentMsToken) {
            setMsToken(currentMsToken);
        }

        if (!urlMsToken) {
            fetchTasks();
        }
    }, [token, router]);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/tasks", {
                headers: { authorization: token },
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setTasks(data);
            }
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        } finally {
            setIsLoading(false);
        }
    };

    const addTask = async (e) => {
        e?.preventDefault();
        if (!title.trim()) return;

        try {
            await fetch("/api/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: token,
                },
                body: JSON.stringify({ title, msToken }),
            });
            setTitle("");
            fetchTasks();
        } catch (error) {
            console.error("Failed to add task", error);
        }
    };

    const toggleTaskLocal = async (id) => {
        // Optimistic update for local UI
        setTasks(tasks.map(t => t._id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t));
        // You could add an API call here to persist completion in the DB
    };

    const loginWithMicrosoft = () => {
        const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/api/sync/callback`;
        const url = `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_TENANT_ID || process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?client_id=${process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=Tasks.ReadWrite&prompt=select_account`;
        window.location.href = url;
    };

    const syncMicrosoft = async (currentMsToken) => {
        setIsSyncing(true);
        try {
            await fetch("/api/microsoft-tasks", {
                method: "POST",
                headers: {
                    authorization: token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ accessToken: currentMsToken }),
            });
            // Refetch perfectly synced tasks from DB
            await fetchTasks();
        } catch (error) {
            console.error("Microsoft sync failed", error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("msToken");
        router.push("/");
    };

    const hasData = tasks.length > 0;
    const engagements = hasData ? [
        { title: "Faculty Meeting", time: "10:00 AM", type: "meeting" },
        { title: "Extra Class", time: "4:00 PM", type: "class" }
    ] : [];

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
            {/* SIDEBAR */}
            <div className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between md:flex z-10 shadow-sm">
                <div>
                    <div className="h-16 flex items-center px-8 border-b border-slate-100">
                        <h2 className="text-xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Anugat Dashboard</h2>
                    </div>
                    <div className="p-4 space-y-1">
                        <Button variant="secondary" className="w-full justify-start gap-3 h-11 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium">
                            <Home size={18} /> Home
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-slate-600 hover:text-slate-900">
                            <Calendar size={18} /> Timetable
                        </Button>
                        {role === "admin" && (
                            <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-slate-600 hover:text-slate-900">
                                <ClipboardList size={18} /> Invigilator Duty
                            </Button>
                        )}
                        <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-slate-600 hover:text-slate-900">
                            <Bell size={18} /> Requests
                        </Button>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut size={18} /> Logout
                    </Button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* TOP HEADER */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 z-10">
                    <div className="w-96">
                        <Input placeholder="Search everything..." className="bg-slate-100 border-none h-10 focus-visible:ring-1 focus-visible:ring-indigo-500" />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-8 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm ring-2 ring-white cursor-pointer">
                            <User size={16} />
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE VIEW */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                    <div className="max-w-6xl mx-auto space-y-8">

                        {/* WELCOME BANNER */}
                        <div className="relative overflow-hidden rounded-2xl bg-indigo-900 text-white shadow-lg">
                            <div className="absolute top-0 right-0 p-12 opacity-10 blur-2xl pointer-events-none">
                                <div className="w-64 h-64 bg-white rounded-full"></div>
                            </div>
                            <div className="relative z-10 p-8 sm:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
                                    <p className="text-indigo-200 font-light max-w-md">Here's a snapshot of your schedule. You have {tasks.filter(t => t.status !== 'completed').length} pending tasks to tackle today.</p>
                                </div>
                                <Button
                                    onClick={msToken ? () => syncMicrosoft(msToken) : loginWithMicrosoft}
                                    disabled={isSyncing}
                                    variant="outline"
                                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm whitespace-nowrap"
                                >
                                    {isSyncing ? "Syncing..." : msToken ? "Refresh MS Tasks" : "Connect MS To Do"}
                                </Button>
                            </div>
                        </div>

                        {/* DASHBOARD GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* LEFT COLUMN: TASKS */}
                            <div className="lg:col-span-2 space-y-8">
                                <Card className="border-none shadow-md overflow-hidden bg-white/60">
                                    <CardHeader className="bg-white border-b border-slate-100 pb-4">
                                        <CardTitle className="flex justify-between items-center text-lg">
                                            <span>Your Tasks</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="p-4 border-b border-slate-100 bg-white">
                                            <form onSubmit={addTask} className="relative flex items-center">
                                                <Input
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="What needs to be done?"
                                                    className="w-full pr-12 h-12 shadow-sm"
                                                />
                                                <Button type="submit" size="icon" className="absolute right-1 h-10 w-10 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">
                                                    <Plus size={18} />
                                                </Button>
                                            </form>
                                        </div>

                                        <div className="max-h-[400px] overflow-y-auto bg-white">
                                            {isLoading ? (
                                                <div className="p-8 text-center text-slate-400">Loading tasks...</div>
                                            ) : tasks.length > 0 ? (
                                                <div className="divide-y divide-slate-50">
                                                    {tasks.map((t) => (
                                                        <div
                                                            key={t._id}
                                                            className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors group ${t.status === 'completed' ? 'opacity-60' : ''}`}
                                                        >
                                                            <button onClick={() => toggleTaskLocal(t._id)} className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors">
                                                                {t.status === 'completed' ? <CheckCircle2 className="text-green-500" size={20} /> : <Circle size={20} />}
                                                            </button>
                                                            <div className="flex-1">
                                                                <p className={`font-medium ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                                                    {t.title}
                                                                </p>
                                                                {t.msTaskId && (
                                                                    <span className="text-[10px] font-medium tracking-wider text-indigo-500 uppercase mt-1 inline-block bg-indigo-50 px-2 py-0.5 rounded">MS To Do</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                        <CheckCircle2 className="text-slate-300" size={32} />
                                                    </div>
                                                    <p>You're all caught up!</p>
                                                    <p className="text-sm mt-1">Add a task above or sync with Microsoft.</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* RIGHT COLUMN: WIDGETS */}
                            <div className="space-y-8">

                                {/* TIMETABLE WIDGET */}
                                <Card className="border-none shadow-md overflow-hidden">
                                    <CardHeader className="bg-white border-b border-slate-100">
                                        <CardTitle className="text-lg">Today's Schedule</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {engagements.length > 0 ? (
                                            <div className="divide-y divide-slate-100">
                                                {engagements.map((e, i) => (
                                                    <div key={i} className="flex gap-4 items-start p-5 bg-white">
                                                        <div className="min-w-[70px] text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{e.time}</div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800">{e.title}</div>
                                                            <div className="text-xs text-slate-500 mt-1 capitalize">{e.type}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-slate-500">No scheduled events today.</div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* ADMIN ROLE WIDGET */}
                                {role === "admin" && (
                                    <Card className="border-none shadow-md bg-linear-to-br from-slate-800 to-slate-900 text-white">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-slate-100">Invigilation Duties</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {hasData ? (
                                                <div className="space-y-4">
                                                    <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                                                        <div className="text-xs text-slate-300 mb-1">9:00 AM</div>
                                                        <div className="font-medium">Room 101</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-slate-400">No duties assigned</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}