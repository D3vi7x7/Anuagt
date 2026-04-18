"use client";

import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

export default function Page() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      {isLogin ? (
        <LoginForm switchToRegister={() => setIsLogin(false)} />
      ) : (
        <RegisterForm switchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}