"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterForm({ switchToLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async () => {
        await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        alert("Registered! Now login.");
        switchToLogin();
    };

    return (
        <div className="flex items-center">
            <Image className="absolute overflow-hidden h-[900px] left-0" src="/Frame 40178.png" alt="image"
                width={800} height={800} />
            <Card className="absolute right-80 w-[450px] p-6 shadow-lg">
                <CardContent className="space-y-4">
                    <h1 className="text-2xl font-bold text-center">Register</h1>

                    <Input
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Input
                        type="password"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button className="w-full" onClick={handleRegister}>
                        Register
                    </Button>

                    <p className="text-sm text-center">
                        Already have an account?{" "}
                        <span
                            className="text-blue-500 cursor-pointer"
                            onClick={switchToLogin}
                        >
                            Login
                        </span>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}