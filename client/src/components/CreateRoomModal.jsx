import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAtom } from "jotai";
import { userAtom } from "@/atoms/userAtom";
import { useNavigate } from "react-router-dom";

function CreateRoomModal({ isOpen, onClose }) {
  const [user] = useAtom(userAtom);

  const [roomName, setRoomName] = useState("");
  const [totalPlayers, setTotalPlayers] = useState(4); // 기본 값 4명
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // console.log(user);
    setRoomName(user.displayName + "의 방");
  }, [user]);

  const handleCreateRoom = async () => {
    if (totalPlayers % 2 !== 0) {
      alert("Total player count must be an even number.");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/create-room`,
        {
          userId: user.uid,
          userName: user.displayName,
          roomName,
          totalPlayers,
          isHost: true,
        },
      );

      const { roomId } = response.data;
      navigate(`/room/${roomId}`);
      onClose(); // 모달 닫기
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Create a New Room</h2>
        <div>
          <label className="block mb-2">
            Room Name:
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              className="border p-2 w-full"
            />
          </label>
        </div>
        <div>
          <label className="block mb-4">
            Total Players:
            <input
              type="number"
              value={totalPlayers}
              onChange={(e) => setTotalPlayers(parseInt(e.target.value, 10))}
              min="2"
              step="2"
              className="border p-2 w-full"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleCreateRoom}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Create
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateRoomModal;
