import React, { useEffect, useRef, useState } from "react";
import { userAtom } from "@/atoms/userAtom.js";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getDatabase, ref, onValue, off } from "firebase/database";
import CreateRoomModal from "@/components/CreateRoomModal.jsx";
import AlertMessage from "@/components/AlertMessage.jsx";

const LoungePage = () => {
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [rooms, setRooms] = useState([]);
  const [user, setUser] = useAtom(userAtom);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const [alertMessage, setAlertMessage] = useState("");

  const dbInstanceRef = useRef();
  dbInstanceRef.current = getDatabase();

  useEffect(() => {
    const checkUserRoom = async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/hello-world`,
      );
      console.log(response);
    };
  }, []);
  useEffect(() => {
    if (user) {
      const checkUserRoom = async () => {
        // const dbInstance = getDatabase();
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/userRoom`,
          {
            params: { userId: user.uid },
          },
        );

        const roomData = response.data;
        if (roomData?.roomId) {
          // 사용자가 참여 중인 방이 있다면 해당 방으로 리다이렉트
          navigate(`/room/${roomData.roomId}`);
        } else {
          // 참여 중인 방이 없다면 라운지로 이동
          navigate("/lounge");
        }
      };

      checkUserRoom();
    }
  }, [user, navigate]);

  useEffect(() => {
    // const dbInstance = getDatabase();
    const roomsRef = ref(dbInstanceRef.current, "rooms");

    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const roomsData = snapshot.val();
      // console.log(roomsData);

      const roomsArray = roomsData
        ? Object.keys(roomsData).map((key) => ({
            roomId: key,
            ...roomsData[key],
          }))
        : [];

      setLoading(false); // 데이터가 도착하면 로딩 상태 해제
      setRooms(roomsArray);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  const showAlert = (message) => {
    setAlertMessage(message);
  };

  //방 참여하기
  const handleJoinRoom = async (roomId) => {
    const room = rooms.find((r) => r.roomId === roomId);
    // console.log(room);
    if (!room) {
      showAlert("방을 찾을 수 없습니다");
      return;
    }
    if (room.gameStarted) {
      showAlert("게임이 이미 시작되었습니다");
      return;
    }
    if (room && room.totalPlayers === Object.values(room.players)?.length) {
      showAlert("게임 인원이 이미 꽉 찼습니다");
      return;
    }
    try {
      // 방에 참여하기 위한 POST 요청을 보냅니다.
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/join-room`,
        {
          roomId,
          userId: user.uid,
          userName: user.displayName,
        },
      );

      if (response.status === 200) {
        // 방에 성공적으로 참여한 경우, 방 페이지로 이동합니다.
        navigate(`/room/${roomId}`);
      } else {
        // 실패한 경우 에러를 처리합니다.
        console.error("Failed to join room:", response.data.message);
      }
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };
  return (
    <div className="mx-auto max-w-[40rem] lg:max-w-[60rem] p-5 ">
      <button
        onClick={openModal}
        className="ml-auto w-full p-2 bg-green-800 text-white rounded my-4"
        // onClick={() => handleJoinRoom(room.roomId)}
      >
        Create Room
      </button>
      {rooms.length === 0 && <p>개설된 방이 없습니다</p>}
      <ul className="flex flex-col gap-2 mt-4">
        {rooms.map(
          (room) =>
            room.players && (
              <li
                onClick={() => handleJoinRoom(room.roomId)}
                className={`cursor-pointer p-2 flex h-14 items-center justify-center rounded-[.4rem] 
      
                ${!room.gameStarted && room.totalPlayers > Object.values(room.players).length ? "bg-green-100" : "bg-gray-100"}
                `}
                key={room.roomId}
              >
                <h4> {room.roomName}</h4>
                <span className={"ml-auto mr-4"}>
                  Players: {Object.values(room.players)?.length || 0} /{" "}
                  {room?.totalPlayers || 0}{" "}
                </span>
              </li>
            ),
        )}
      </ul>
      {/* 모달 컴포넌트 */}
      <CreateRoomModal isOpen={isModalOpen} onClose={closeModal} />
      {/*알림메시지 컴포넌트*/}
      <AlertMessage
        message={alertMessage}
        duration={3000}
        onClose={() => setAlertMessage("")}
      />
    </div>
  );
};

export default LoungePage;
