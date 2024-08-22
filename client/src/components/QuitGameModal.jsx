import React from "react";
import ConfirmationModal from "./ConfirmationModal";

function QuitGameModal({ isOpen, onClose, onConfirm }) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      title="게임 중단"
      message="게임을 중단하고 새로 게임을 시작할 수 있게 됩니다. 게임을 중단하시겠습니까?"
      confirmText="확인"
      cancelText="취소"
      onConfirm={onConfirm}
    />
  );
}

export default QuitGameModal;
