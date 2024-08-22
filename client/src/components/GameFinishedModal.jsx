import React from "react";
import ConfirmationModal from "./ConfirmationModal";

function GameFinishedModal({ isOpen, onClose, winner }) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      title="게임이 끝났습니다!!"
      message={`${winner} 팀 의 우승!! 방장은 게임을 다시 시작할 수 있습니다.`}
      confirmText="확인"
      cancelText="취소"
      onConfirm={onClose}
    />
  );
}

export default GameFinishedModal;
