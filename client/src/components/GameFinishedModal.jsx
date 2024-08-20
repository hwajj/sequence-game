import React from "react";

function GameFinishedModal({ isOpen, onClose, winner }) {
  if (!isOpen) return;
  return (
    <div className="fixed border-blue inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">게임이 끝났습니다!!</h2>
        <h3>{winner} 팀 의 우승!!</h3>
        <p> 방장은 게임을 다시 시작할 수 있습니다. </p>
        <button
          onClick={onClose}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default GameFinishedModal;
