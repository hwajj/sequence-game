import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { alertMessageAtom, alertVisibleAtom } from "@/atoms/alertAtoms.js";

function AlertMessage({ duration = 3000 }) {
  const [message, setMessage] = useAtom(alertMessageAtom);
  const [visible, setVisible] = useAtom(alertVisibleAtom);

  useEffect(() => {
    if (message) {
      setVisible(true);
    }
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setMessage(""), 300); // 트랜지션 시간 후에 메시지 초기화
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, setMessage, setVisible]);

  if (!message) return null;

  return (
    <div
      className={`fixed main-font top-1/3 left-1/2 transform -translate-x-1/2 
      transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}
      bg-red-400 text-white py-2 px-4 rounded z-50`}
    >
      {message}
    </div>
  );
}

export default AlertMessage;
