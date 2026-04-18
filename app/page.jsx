"use client";

import { useState } from "react";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

export default function Page() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex w-full">
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
        <Image
          src="/Frame 40178.png"
          alt="Task Dashboard Illustration"
          fill
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-t from-slate-900/90 via-slate-900/20 to-transparent" />
        <div className="absolute bottom-16 left-12 right-12 text-white z-10">
          <h2 className="text-4xl font-bold mb-4">Manage your tasks effortlessly</h2>
          <p className="text-lg opacity-90 font-light">Organize, track, and sync your to-dos with our beautiful dashboard.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50/50">
        <div className="w-full max-w-[450px]">
          {isLogin ? (
            <LoginForm switchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm switchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}