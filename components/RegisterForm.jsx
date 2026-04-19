"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterForm({ switchToLogin }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                alert("Registered! Now login.");
                switchToLogin();
            } else {
                const data = await res.json();
                alert(data.error || "Registration failed. Please try again.");
            }
        } catch (error) {
            console.error("Register Error:", error);
            alert("An error occurred during registration.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="flex flex-col items-center text-center mb-10">
                <div className="flex items-center mb-6">
                    <span className="text-[32px] font-bold text-gray-900 tracking-tight">Anugat AI</span>
                </div>

                <div className="space-y-1 mb-5 w-full flex flex-col items-center">
                    <h1 className="text-[42px] font-black text-black leading-tight tracking-[0]">JOIN</h1>
                    <h1 className="text-[36px] sm:text-[46px] font-black text-blue-500 leading-tight uppercase tracking-tight whitespace-nowrap">SAMAYAK DASHBOARD!</h1>
                </div>
                
                <p className="text-[#5f6368] font-medium text-[15px] mt-2">
                    Enter your details below to create your account.
                </p>
            </div>
            
            <div className="space-y-5">
                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-[56px] rounded-2xl border border-[#e5e7eb] bg-white placeholder:text-gray-400 font-medium text-base px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[56px] rounded-2xl border border-[#e5e7eb] bg-white placeholder:text-gray-400 font-medium text-base px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[56px] rounded-2xl border border-[#e5e7eb] bg-white placeholder:text-gray-400 font-medium text-base px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                
                <div className="pt-2">
                    <button 
                        className="w-full h-[60px] text-[18px] font-medium rounded-2xl bg-blue-500 hover:opacity-95 transition-all shadow-[0_12px_24px_-10px_rgba(37,99,235,0.4)] text-white"
                        onClick={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating account..." : "Create Account"}
                    </button>
                </div>
            </div>

            <div className="text-center mt-12">
                <span className="text-[#5f6368] font-medium text-[15px]">
                    Already have an account?{" "}
                    <button
                        type="button"
                        className="font-medium text-[#2563eb] hover:text-blue-700 transition-colors"
                        onClick={switchToLogin}
                    >
                        Sign in
                    </button>
                </span>
            </div>
        </div>
    );
}