import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { userAtom } from "@/atoms/userAtom.js";
import { useAtom } from "jotai";
import { getDatabase, ref } from "firebase/database";
import axios from "axios";

export default function SplashPage() {
  const logoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(
      logoRef.current,
      { opacity: 0, x: 4 }, // 초기 상태
      {
        opacity: 1,
        x: 0,
        duration: 3,
        ease: "power3.out",
        onComplete: () => {
          navigate("/login"); // 애니메이션이 완료된 후 login 페이지로 이동
        },
      },
    );
  }, [navigate]);

  return (
    <div className="w-full border-red h-full flex items-center justify-center">
      <h1 ref={logoRef} className=" text-5xl logo-font">
        Sequence
      </h1>
    </div>
  );
}
