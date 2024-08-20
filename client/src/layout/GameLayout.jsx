import React from "react";

export default function GameLayout({ content1, content2 }) {
  return (
    <div className="flex flex-col h-screen">
      {/* 상단 영역 */}
      <div className="h-30 p-4 bg-gray-100">
        <GameTutorialModalButton />
        {content1}
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-grow p-4 bg-white">{content2}</div>
    </div>
  );
}
