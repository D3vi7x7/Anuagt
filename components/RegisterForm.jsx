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
        <Card className="border-0 shadow-xl bg-white sm:border sm:shadow-sm">
            <CardHeader className="space-y-2 text-center pb-6">
                <CardTitle className="text-3xl font-bold tracking-tight">Create an account</CardTitle>
                <CardDescription className="text-base">Enter your email below to create your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12"
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12"
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12"
                        />
                    </div>
                    <Button 
                        className="w-full h-11 text-base bg-slate-900 hover:bg-slate-800" 
                        onClick={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating account..." : "Sign Up"}
                    </Button>
                </div>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground pt-4 block">
                        Already have an account?{" "}
                        <button
                            type="button"
                            className="font-medium text-primary hover:text-primary/80 hover:underline transition-all"
                            onClick={switchToLogin}
                        >
                            Sign in
                        </button>
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}