"use client";

import { useState } from "react";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

export default function Page() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex w-full font-sans">
      <div className="hidden lg:flex w-1/3 relative bg-[#0147B6] flex-col items-center justify-center p-12 overflow-hidden">

        <div className="absolute w-full max-w-[650px] aspect-4/3 flex-1 z-10">
          <Image
            src="/Frame 40178.png"
            alt="Samayak Dashboard Interface"
            width={1000}
            height={1000}
            className="object-contain object-top scale-105"
            priority
          />
        </div>

        {/* Subtle background decoration if needed, keeping it clean for now */}
      </div>

      <div className="w-full lg:w-2/3 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-[480px]">
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