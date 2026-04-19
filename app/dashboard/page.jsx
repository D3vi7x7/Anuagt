"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Plus, User, Bell, Calendar, Home, ClipboardList, LogOut, Menu, X, Edit3, ArrowUpRight, FolderHeart, MailPlus, FileText, Users } from "lucide-react";
import Image from "next/image";
import gsap from "gsap";

export default function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");

    // Quiz/Meeting scheduling state
    const [quizTitle, setQuizTitle] = useState("");
    const [quizDate, setQuizDate] = useState("");
    const [isAddingQuiz, setIsAddingQuiz] = useState(false);
    const [meetingTitle, setMeetingTitle] = useState("");
    const [meetingDate, setMeetingDate] = useState("");
    const [isAddingMeeting, setIsAddingMeeting] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [msToken, setMsToken] = useState(null);
    const [userName, setUserName] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isInvigilatorOpen, setIsInvigilatorOpen] = useState(false);

    const containerRef = useRef(null);

    const Duties = [
        { id: 1, room: "Hall B", date: "Oct 25, 2026", time: "09:00 AM - 12:00 PM" },
        { id: 2, room: "Room 104", date: "Oct 28, 2026", time: "02:00 PM - 05:00 PM" },
        { id: 3, room: "Lab 3", date: "Nov 02, 2026", time: "10:00 AM - 01:00 PM" }
    ];

    // Close sidebar on window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const router = useRouter();

    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/");
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.name) setUserName(payload.name);
        } catch (e) {
            console.error("Token parse error");
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

    // GSAP animations
    useEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from(".dash-anim-left", { x: -60, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" });
            gsap.from(".dash-anim-right", { x: 60, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out", delay: 0.2 });
            gsap.from(".dash-anim-bottom", { y: 60, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out", delay: 0.4 });

            gsap.from(".clockImg", { y: 60, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out", delay: 0.4 });
        }, containerRef);
        return () => ctx.revert();
    }, []);

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
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: token,
                },
                body: JSON.stringify({ title, msToken, dueDate: dueDate || undefined }),
            });
            const data = await res.json();

            if (data.msError) {
                alert("Microsoft To Do Error: " + data.msError);
            } else if (!msToken) {
                alert("Task saved locally. Microsoft To Do sync skipped because you are not logged in (msToken is missing). Please click 'Connect MS To Do'.");
            }

            setTitle("");
            setDueDate("");
            fetchTasks();
        } catch (error) {
            console.error("Failed to add task", error);
        }
    };

    const addEngagement = async (e, type) => {
        e?.preventDefault();

        const engagementTitle = type === "quiz" ? quizTitle : meetingTitle;
        const engagementDate = type === "quiz" ? quizDate : meetingDate;

        if (!engagementTitle.trim()) return;

        try {
            await fetch("/api/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: token,
                },
                body: JSON.stringify({
                    title: engagementTitle,
                    dueDate: engagementDate || undefined,
                    category: type
                }),
            });

            if (type === "quiz") {
                setQuizTitle("");
                setQuizDate("");
                setIsAddingQuiz(false);
            } else {
                setMeetingTitle("");
                setMeetingDate("");
                setIsAddingMeeting(false);
            }
            fetchTasks();
        } catch (error) {
            console.error(`Failed to add ${type}`, error);
        }
    };

    const toggleTaskLocal = async (id) => {
        const task = tasks.find(t => t._id === id);
        if (!task) return;

        const newStatus = task.status === "completed" ? "pending" : "completed";
        // Optimistic update for local UI
        setTasks(tasks.map(t => t._id === id ? { ...t, status: newStatus } : t));

        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    authorization: token,
                },
                body: JSON.stringify({ status: newStatus, msToken }),
            });

            const data = await res.json();
            if (data.deleted) {
                // Remove from local state
                setTasks(prevTasks => prevTasks.filter(t => t._id !== id));
            } else {
                // Sync state just in case
                fetchTasks();
            }
        } catch (error) {
            console.error("Failed to update task", error);
            fetchTasks(); // Revert optimistic UI on error
        }
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

    const regularTasks = tasks.filter(t => !t.category || t.category === "task");
    const pendingEngagements = tasks.filter(t => (t.category === "quiz" || t.category === "meeting") && t.status !== "completed");

    let flag = false;
    let completeCount = 0;

    for (const t of regularTasks) {
        if (t.status === "completed") {
            completeCount++;
        }
    }

    flag = completeCount === regularTasks.length && regularTasks.length > 0;

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("msToken");
        router.push("/");
    };

    return (
        <div className="flex h-screen bg-[#cfe1ed] text-slate-900 overflow-hidden font-sans p-2 sm:p-5 gap-5">

            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden rounded-[30px]"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <div className={`fixed inset-y-5 top-0 left-2 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"} lg:relative lg:translate-x-0 w-[280px] bg-white rounded-[30px] flex flex-col justify-between z-50 transition duration-200 ease-in-out shadow-sm py-8 px-5 shrink-0`}>
                <div>
                    <div className="flex items-center gap-3 px-3 mb-10">
                        <h2 className="text-xl font-bold tracking-tight">Anugat AI</h2>
                        <button className="ml-auto lg:hidden p-1 text-slate-400 hover:text-slate-600" onClick={() => setIsSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start gap-4 h-[50px] bg-blue-500 text-white hover:bg-blue-600 hover:text-white font-medium rounded-2xl shadow-sm text-[15px] px-4">
                            <Home size={20} /> Home
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-4 h-[50px] text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-2xl font-medium text-[15px] px-4">
                            <Calendar size={20} className="text-slate-500" /> Class Timetable
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-4 h-[50px] text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-2xl font-medium text-[15px] px-4">
                            <ClipboardList size={20} className="text-slate-500" /> Invigilator Task
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-4 h-[50px] text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-2xl font-medium text-[15px] px-4">
                            <Calendar size={20} className="text-slate-500" /> Requests
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-4 h-[50px] text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-2xl font-medium text-[15px] px-4">
                            <FolderHeart size={20} className="text-slate-500" /> Extra Class
                        </Button>
                    </div>
                </div>

                <div>
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-4 h-[50px] bg-black text-white hover:bg-slate-800 hover:text-white rounded-2xl shadow-md text-[15px] px-4">
                        <LogOut size={20} /> Log out
                    </Button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden w-full gap-5">
                {/* TOP HEADER */}
                <header className="h-[76px] bg-white rounded-[30px] flex items-center justify-between px-6 sm:px-8 w-full shrink-0 shadow-sm">
                    <div className="flex items-center gap-3 sm:gap-6 flex-1">
                        <button className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="relative w-full max-w-[400px]">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <svg className="w-[18px] h-[18px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <Input placeholder="Search" className="bg-[#eef2f6] border-none h-[44px] w-full pl-11 pr-12 rounded-[22px] focus-visible:ring-1 focus-visible:ring-blue-500 shadow-inner font-medium text-[15px] placeholder:text-slate-400" />
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <svg className="w-[18px] h-[18px] text-slate-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" /></svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 ml-4">
                        <button className="relative text-slate-600 hover:text-slate-800 transition-colors mt-1">
                            <Bell size={24} />
                        </button>
                        <div className="h-11 w-11 rounded-[16px] bg-black flex items-center justify-center text-white shadow-md cursor-pointer hover:bg-slate-800 transition-colors">
                            <User size={20} />
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE VIEW */}
                <main className="flex-1 overflow-y-auto pb-4 pr-2 scrollbar-hide" ref={containerRef}>
                    <div className="w-full space-y-5">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* LEFT & CENTER COLUMN */}
                            <div className="flex flex-col gap-6 lg:col-span-2">
                                {/* Welcome Banner */}
                                <div className="dash-anim-left relative overflow-hidden rounded-[30px] bg-blue-500 text-white p-8 sm:p-10 flex flex-col sm:flex-row justify-between items-center h-auto sm:h-[180px] z-10 shadow-sm">
                                    <div className="relative z-10 w-full flex flex-col justify-center h-full pt-1">
                                        <h1 className="text-[30px] sm:text-[30px] leading-tight font-bold mb-1 tracking-tight">Welcome {userName}!</h1>
                                        <p className="text-white/90 text-[12px] sm:text-[14px] font-medium w-full max-w-[340px] mb-2 leading-relaxed hidden sm:block">Count on me to support you, organize your tasks, and make your workday smoother.</p>
                                        <div className="flex gap-3 mt-auto flex-wrap">
                                            <Button className="bg-white text-blue-600 hover:bg-slate-50 rounded-xl h-10 px-5 font-bold flex items-center gap-2 shadow-sm text-[14px]">
                                                <CheckCircle2 size={18} className="text-blue-500" strokeWidth={2.5} /> Manage tasks
                                            </Button>
                                            <Button className="bg-white text-slate-800 hover:bg-slate-50 rounded-xl h-10 px-5 font-bold flex items-center gap-2 shadow-sm text-[14px]">
                                                <Plus size={18} strokeWidth={2.5} /> Reminders
                                            </Button>
                                            <Button
                                                onClick={msToken ? () => syncMicrosoft(msToken) : loginWithMicrosoft}
                                                disabled={isSyncing}
                                                className="bg-white/15 text-white hover:bg-white/20 border border-white/20 rounded-xl h-10 px-5 font-bold flex items-center shadow-sm text-[14px]"
                                            >
                                                {isSyncing ? "Syncing..." : msToken ? "Refresh MS Tasks" : "Connect MS To Do"}
                                            </Button>
                                        </div>
                                    </div>
                                    <Image src="/clock.png" className="clockImg w-[140px] sm:w-[260px] h-auto drop-shadow-2xl absolute right-[-10px] top-[20px] sm:right-3 sm:top-[150px] sm:-translate-y-1/2 opacity-20 sm:opacity-100 pointer-events-none" alt="Clock" width={400} height={400} priority />
                                </div>

                                {/* Today's Engagement */}
                                <Card className="dash-anim-left border-none shadow-sm rounded-[30px] bg-white overflow-hidden p-6 sm:p-8 relative flex-1 max-h-[280px] flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex gap-2.5 items-center text-[20px] sm:text-[22px] font-bold text-slate-800">
                                            <Edit3 size={24} strokeWidth={2.2} /> Today's Engagement
                                        </div>
                                    </div>

                                    {pendingEngagements.length > 0 ? (
                                        <div className="flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar space-y-2 mt-2">
                                            {pendingEngagements.map(e => (
                                                <div key={e._id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-slate-100 transition-colors">
                                                    <button onClick={() => toggleTaskLocal(e._id)} className="mt-0.5 shrink-0 transition-transform active:scale-95 text-slate-300 hover:text-blue-500">
                                                        <Circle size={22} strokeWidth={2.5} />
                                                    </button>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-bold tracking-wider uppercase inline-block px-2 py-0.5 rounded-md ${e.category === 'quiz' ? 'text-indigo-600 bg-indigo-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                                                {e.category}
                                                            </span>
                                                        </div>
                                                        <p className="text-[16px] font-semibold text-slate-800">{e.title}</p>
                                                        {e.dueDate && <p className="text-[13px] font-medium text-slate-500 mt-1.5 flex items-center gap-1.5"><Calendar size={13} /> {new Date(e.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 h-full">
                                            <div className="relative w-full sm:w-1/2 h-[160px] sm:h-[190px]">
                                                <Image src="/task_illus.png" alt="Relaxing" fill className="object-contain sm:object-left" />
                                            </div>
                                            <div className="text-center sm:text-right w-full sm:w-1/2 flex flex-col justify-center">
                                                <p className="text-[16px] sm:text-[18px] font-medium text-slate-800 leading-[1.4] mb-6">It's a holiday today! No engagements scheduled. Enjoy your day off.</p>
                                                <div className="flex gap-3 justify-center sm:justify-end flex-wrap">
                                                    <Button className="bg-black text-white hover:bg-slate-800 rounded-[14px] h-[40px] sm:h-[42px] px-4 sm:px-5 text-[13px] sm:text-[14px] font-semibold shadow-md whitespace-nowrap">Weekly Schedule</Button>
                                                    <Button className="bg-black text-white hover:bg-slate-800 rounded-[14px] h-[40px] sm:h-[42px] px-4 sm:px-5 text-[13px] sm:text-[14px] font-semibold shadow-md whitespace-nowrap">Share Schedule</Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>

                                {/* Bottom row: Quiz Scheduler & Meetings */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Card className="dash-anim-bottom rounded-[30px] border-none shadow-sm p-6 relative bg-white min-h-[200px] flex flex-col">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-[18px] sm:text-[19px] font-bold flex gap-2.5 items-center text-slate-800"><FileText size={20} strokeWidth={2.2} /> Quiz Scheduler</h3>
                                            <div className="flex gap-2">
                                                <div className="w-[34px] h-[34px] rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"><Bell size={16} className="text-slate-700" /></div>
                                                <div className="w-[34px] h-[34px] rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"><ArrowUpRight size={16} className="text-slate-700" /></div>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                                            {pendingEngagements.length === 0 && pendingEngagements.filter(e => e.category === "quiz").length === 0 ? <div className="relative w-[100px] sm:w-[120px] h-[100px] sm:h-[120px] shrink-0 mx-auto sm:mx-0">
                                                <Image src="/quiz_illus.png" alt="Quiz" fill className="object-contain object-center sm:object-left" />
                                            </div> : <div></div>}
                                            <div className="flex flex-col items-center sm:items-end gap-3.5 flex-1 w-full text-center sm:text-right">
                                                {isAddingQuiz ? (
                                                    <form onSubmit={(e) => addEngagement(e, "quiz")} className="w-full flex flex-col gap-2">
                                                        <Input autoFocus value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Quiz topic..." className="h-[36px] bg-slate-50 border-slate-200 text-[14px] rounded-xl" />
                                                        <div className="flex gap-2">
                                                            <Input type="datetime-local" value={quizDate} onChange={(e) => setQuizDate(e.target.value)} className="h-[36px] bg-slate-50 border-slate-200 text-[12px] flex-1 rounded-xl px-2" />
                                                            <Button type="submit" className="h-[36px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 font-semibold shadow-sm">Save</Button>
                                                            <Button type="button" onClick={() => setIsAddingQuiz(false)} variant="ghost" className="h-[36px] text-slate-500 hover:bg-slate-100 rounded-xl px-2"><X size={18} /></Button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <>
                                                        {pendingEngagements.length > 0 && pendingEngagements.filter(e => e.category === "quiz").length > 0 ? (
                                                            pendingEngagements.map(e => e.category === "quiz" && (
                                                                <div key={e._id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all group w-full">
                                                                    <button onClick={() => toggleTaskLocal(e._id)} className="mt-0.5 text-slate-300 hover:text-blue-500 transition-colors shrink-0">
                                                                        {e.status === 'completed' ? <CheckCircle2 className="text-blue-500" size={22} strokeWidth={2.5} /> : <Circle size={22} strokeWidth={2.5} />}
                                                                    </button>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                                            <h3 className={`font-semibold text-slate-800 text-[15px] sm:text-[16px] leading-tight ${e.status === 'completed' ? 'line-through text-slate-400' : ''}`}>{e.title}</h3>
                                                                            {e.dueDate && (
                                                                                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
                                                                                    <Calendar size={12} /> {new Date(e.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-2 mt-1">
                                                                            <span className="text-[11px] text-slate-500 font-medium capitalize">{e.category}</span>
                                                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button onClick={() => toggleTaskLocal(e._id)} className="text-slate-400 hover:text-blue-500"><CheckCircle2 size={18} strokeWidth={2.5} /></button>

                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="font-semibold text-slate-800 text-[15px] sm:text-[16px] italic leading-tight">"No Quizzes<br className="hidden sm:block" /> Scheduled"</p>
                                                        )}
                                                        <Button onClick={() => setIsAddingQuiz(true)} className="bg-[#1e293b] text-white hover:bg-black rounded-xl h-[34px] px-4 text-[13px] font-semibold w-full sm:w-auto"><Plus size={16} strokeWidth={3} className="mr-1.5" /> Schedule Now</Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="dash-anim-bottom rounded-[30px] border-none shadow-sm p-6 relative bg-white min-h-[200px] flex flex-col">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-[18px] sm:text-[19px] font-bold flex gap-2.5 items-center text-slate-800"><Users size={20} strokeWidth={2.2} /> Meetings</h3>
                                            <div className="flex gap-2">
                                                <div className="w-[34px] h-[34px] rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"><Bell size={16} className="text-slate-700" /></div>
                                                <div className="w-[34px] h-[34px] rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"><ArrowUpRight size={16} className="text-slate-700" /></div>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                                            {pendingEngagements.length === 0 && pendingEngagements.filter(e => e.category === "meeting").length === 0 ? <div className="relative w-[100px] sm:w-[120px] h-[100px] sm:h-[120px] shrink-0 mx-auto sm:mx-0">
                                                <Image src="/meeting_illus.png" alt="Meetings" fill className="object-contain object-center sm:object-left" />
                                            </div> : <div></div>}
                                            <div className="flex flex-col items-center sm:items-end gap-3.5 flex-1 w-full text-center sm:text-right">
                                                {isAddingMeeting ? (
                                                    <form onSubmit={(e) => addEngagement(e, "meeting")} className="w-full flex flex-col gap-2">
                                                        <Input autoFocus value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Meeting agenda..." className="h-[36px] bg-slate-50 border-slate-200 text-[14px] rounded-xl" />
                                                        <div className="flex gap-2">
                                                            <Input type="datetime-local" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="h-[36px] bg-slate-50 border-slate-200 text-[12px] flex-1 rounded-xl px-2" />
                                                            <Button type="submit" className="h-[36px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 font-semibold shadow-sm">Save</Button>
                                                            <Button type="button" onClick={() => setIsAddingMeeting(false)} variant="ghost" className="h-[36px] text-slate-500 hover:bg-slate-100 rounded-xl px-2"><X size={18} /></Button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <>
                                                        {pendingEngagements.filter(e => e.category === "meeting").length > 0 ? (
                                                            pendingEngagements.filter(e => e.category === "meeting").map(e => (
                                                                <div key={e._id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all group w-full">
                                                                    <button onClick={() => toggleTaskLocal(e._id)} className="mt-0.5 text-slate-300 hover:text-blue-500 transition-colors shrink-0">
                                                                        {e.status === 'completed' ? <CheckCircle2 className="text-blue-500" size={22} strokeWidth={2.5} /> : <Circle size={22} strokeWidth={2.5} />}
                                                                    </button>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                                            <h3 className={`font-semibold text-slate-800 text-[15px] sm:text-[16px] leading-tight ${e.status === 'completed' ? 'line-through text-slate-400' : ''}`}>{e.title}</h3>
                                                                            {e.dueDate && (
                                                                                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
                                                                                    <Calendar size={12} /> {new Date(e.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[13px] text-slate-500 font-medium mt-0.5">Meeting</p>
                                                                    </div>

                                                                </div>
                                                            ))
                                                        ) : (
                                                            <>
                                                                <p className="font-semibold text-slate-800 text-[15px] sm:text-[16px] italic leading-tight">"No Meetings<br className="hidden sm:block" /> Scheduled"</p>

                                                            </>
                                                        )}
                                                        <Button onClick={() => setIsAddingMeeting(true)} className="bg-[#1e293b] text-white hover:bg-black rounded-xl h-[34px] px-4 text-[13px] font-semibold w-full sm:w-auto"><Plus size={16} strokeWidth={3} className="mr-1.5" /> Schedule Now</Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="flex flex-col gap-6 lg:col-span-1">
                                {/* Today's Focus */}
                                <Card className="dash-anim-right rounded-[30px] border-none shadow-sm p-5 sm:p-6 bg-white min-h-[300px] flex flex-col relative">
                                    <h3 className="text-[18px] sm:text-[20px] font-bold flex gap-2.5 items-center text-slate-800 mb-4"><Image src="/todo_logo.png" alt="Tasks" width={30} height={30} className="object-contain object-center sm:object-left" /> Today's Focus</h3>

                                    <form onSubmit={addTask} className="flex flex-col gap-3 mb-4 shrink-0">
                                        <div className="relative flex items-center">
                                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" className="w-full pr-[52px] h-[48px] bg-[#f8fafc] border border-slate-100 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-500 font-medium text-[15px]" />
                                            <Button type="submit" size="icon" className="absolute right-1.5 h-[36px] w-[36px] rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-sm"><Plus size={18} strokeWidth={2.5} /></Button>
                                        </div>
                                        <div className="flex items-center gap-2 px-1">
                                            <Calendar size={16} className="text-slate-400" />
                                            <Input
                                                type="datetime-local"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="h-[36px] text-[13px] bg-transparent border border-slate-200 rounded-xl text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500 px-3 flex-1 sm:flex-none"
                                            />
                                        </div>
                                    </form>

                                    {(regularTasks.length > 0 && !flag) ? <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                                        {regularTasks.length > 0 ? regularTasks.map((t) => (
                                            <div key={t._id} className={`flex items-start gap-3.5 p-3.5 hover:bg-slate-50/80 border border-transparent hover:border-slate-100 rounded-2xl transition-all group ${t.status === 'completed' ? 'opacity-50 grayscale-[50%]' : ''}`}>
                                                <button onClick={() => toggleTaskLocal(t._id)} className="mt-0.5 text-slate-300 hover:text-blue-500 transition-colors shrink-0">
                                                    {t.status === 'completed' ? <CheckCircle2 className="text-blue-500" size={22} strokeWidth={2.5} /> : <Circle size={22} strokeWidth={2.5} />}
                                                </button>
                                                <div className="flex-1 pt-0.5">
                                                    <p className={`text-[15px] font-medium ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-800'}`}>{t.title}</p>
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        {t.msTaskId && <span className="text-[10px] font-bold tracking-wider text-blue-500 uppercase inline-block bg-blue-50 px-2 py-0.5 rounded-md">MS To Do</span>}
                                                        {t.dueDate && <span className="text-[10px] font-medium tracking-wide text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1"><Calendar size={10} /> {new Date(t.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : <div className="text-center py-8 text-[15px] font-medium text-slate-400">All tasks completed.</div>}
                                    </div> :
                                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                                            <div className="relative w-[140px] sm:w-[160px] h-[100px] sm:h-[120px] mb-4">
                                                <Image src="/todo_illus.png" alt="To Do Focus" fill className="object-contain" priority />
                                            </div>
                                            <p className="font-semibold text-slate-800 mb-4 w-full max-w-[240px] leading-[1.4] text-[14px]">Power your planning with Microsoft To Do, built right into your workspace.</p>

                                            <Button
                                                onClick={msToken ? () => syncMicrosoft(msToken) : loginWithMicrosoft}
                                                disabled={isSyncing}
                                                className="bg-[#2177c8] hover:bg-[#1a5f9f] text-white rounded-[16px] w-[200px] h-[48px] shadow-[0_6px_16px_rgba(33,119,200,0.3)] font-semibold text-[14px] sm:text-[15px] whitespace-nowrap"
                                            >
                                                {isSyncing ? "Syncing..." : msToken ? "Refresh MS Tasks" : "Sync with To-Do"}
                                            </Button>
                                        </div>}
                                </Card>

                                {/* Invigilator Duty */}
                                <div
                                    className="dash-anim-right relative min-h-[220px] flex-1 px-1 drop-shadow-sm flex flex-col justify-end cursor-pointer group"
                                    onClick={() => setIsInvigilatorOpen(!isInvigilatorOpen)}
                                >
                                    {/* Folder Back Tab */}
                                    <div className="absolute bottom-[170px] left-1/2 -translate-x-1/2 flex flex-col items-center w-[85%] z-0">
                                        {!isInvigilatorOpen ? <div className="w-[85%] h-[16px] bg-[#1a5f9f] rounded-t-[14px]"></div> : <div></div>}
                                        {!isInvigilatorOpen ? <div className="w-[92%] h-[16px] bg-[#2177c8] rounded-t-[14px] -mt-[6px]"></div> : <div></div>}
                                    </div>

                                    {/* Cards */}
                                    <div className="absolute bottom-[20px] left-0 w-full px-4 z-0 flex flex-col gap-2 items-center pointer-events-none">
                                        {Duties.map((duty, idx) => (
                                            <div
                                                key={duty.id}
                                                className="w-[90%] bg-blue-500 rounded-2xl shadow-lg border p-4 transition-all duration-500 absolute origin-bottom"
                                                style={{
                                                    transform: isInvigilatorOpen
                                                        ? `translateY(-${(Duties.length - idx) * 65 + 150}px) scale(1)`
                                                        : `translateY(10px) scale(${1 - (Duties.length - idx) * 0.05})`,
                                                    opacity: isInvigilatorOpen ? 1 : 0,
                                                    transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                                                    transitionDelay: isInvigilatorOpen ? `${idx * 40}ms` : "0ms",
                                                    zIndex: idx
                                                }}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-white text-[15px]">{duty.room}</span>
                                                    <span className="text-[11px] font-bold text-black bg-blue-50 px-2 py-0.5 rounded-md tracking-wide uppercase">{duty.date}</span>
                                                </div>
                                                <p className="text-[13px] text-white font-medium flex items-center gap-1.5 mt-1.5"><Calendar size={12} /> {duty.time}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Folder Front Cover */}
                                    <div className={`relative z-10 w-full h-[180px] bg-[#e1ecf4] border-[#b4cbe1] rounded-[24px] flex items-center justify-center border-dashed border-[2.5px] overflow-hidden transition-transform duration-500 origin-bottom ${isInvigilatorOpen ? "translate-y-4 scale-[1.02]" : "group-hover:-translate-y-1"}`}>
                                        <div className="absolute inset-0 bg-white/20"></div>
                                        <div className="absolute top-0 left-0 w-full h-[3px] bg-white/50"></div>
                                        <div className="flex flex-col items-center gap-1.5 relative z-20">
                                            <h3 className="text-[20px] sm:text-[22px] font-semibold text-slate-800 font-sans tracking-wide text-center px-4">Invigilator Duty</h3>
                                            <p className="text-[12px] font-semibold text-slate-500 flex items-center gap-1 opacity-80 mt-1">Tap folder to {isInvigilatorOpen ? "close" : "open"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
              .scrollbar-hide::-webkit-scrollbar {
                  display: none;
              }
              .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
              }
              .custom-scrollbar::-webkit-scrollbar {
                  width: 5px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: #cbd5e1;
                  border-radius: 10px;
              }
            `}</style>
        </div>
    );
}