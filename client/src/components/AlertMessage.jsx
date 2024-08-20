import React, { useEffect, useState } from "react";

function AlertMessage({ message, duration = 3000, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (message) {
      setVisible(true);
    }
    // 설정된 시간이 지나면 트랜지션을 위해 visible을 false로 설정
    const timer = setTimeout(() => {
      setVisible(false);

      // 트랜지션 시간 후에 onClose 호출
      setTimeout(onClose, 300); // 트랜지션 시간이 300ms로 설정됨
    }, duration);

    // 컴포넌트가 언마운트될 때 타이머를 정리합니다.
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

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
