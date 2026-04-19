"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import gsap from "gsap";

export default function Page() {
  const [isLogin, setIsLogin] = useState(true);
  const imagesRef = useRef([]);

  useEffect(() => {
    if (!imagesRef.current.length || imagesRef.current.length < 3) return;

    const tl = gsap.timeline({ repeat: -1 });



    tl.to(imagesRef.current[1], { opacity: 1, duration: 1, delay: 2 })
      .to(imagesRef.current[0], { opacity: 0, duration: 1 }, "<")

      .to(imagesRef.current[2], { opacity: 1, duration: 1, delay: 2 })
      .to(imagesRef.current[1], { opacity: 0, duration: 1 }, "<")

      .to(imagesRef.current[0], { opacity: 1, duration: 1, delay: 2 })
      .to(imagesRef.current[2], { opacity: 0, duration: 1 }, "<");

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="min-h-screen flex w-full font-sans">
      <div className="hidden lg:flex w-1/3 relative bg-[#0147B6] flex-col items-center justify-center p-12 overflow-hidden">

        <div className="absolute top-0 w-full max-w-[650px] aspect-[4/3] flex-1 z-10">
          <Image
            ref={el => imagesRef.current[0] = el}
            src="/frame1.png"
            alt="Dashboard Interface 1"
            width={1000}
            height={1000}
            className="absolute inset-0 object-contain object-top scale-105"
            priority
          />
          <Image
            ref={el => imagesRef.current[1] = el}
            src="/frame2.png"
            alt="Dashboard Interface 2"
            width={1000}
            height={1000}
            className="absolute inset-0 object-contain object-top scale-105 opacity-0"
            priority
          />
          <Image
            ref={el => imagesRef.current[2] = el}
            src="/frame3.png"
            alt="Dashboard Interface 3"
            width={1000}
            height={1000}
            className="absolute inset-0 object-contain object-top scale-105 opacity-0"
            priority
          />
        </div>

        {/* Subtle background decoration if needed, keeping it clean for now */}
      </div>

      <div className="relative z-30 shadow-3xl w-full lg:w-2/3 flex items-center justify-center p-6 sm:p-12 bg-white">
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