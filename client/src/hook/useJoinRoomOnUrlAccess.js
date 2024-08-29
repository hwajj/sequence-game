import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const useUserRoomRedirect = (user, setAlertMessage) => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    if (user && roomId) {
      const checkUserRoom = async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/userRoom`,
            {
              params: { userId: user.uid },
            },
          );

          const roomData = response.data;

          if (roomData?.roomId) {
            // 사용자가 이미 방에 참여 중이라면 해당 방으로 리다이렉트
            navigate(`/room/${roomData.roomId}`);
          } else {
            // 참여 중인 방이 없다면 현재 URL의 방으로 참여 시도
            await joinRoom();
          }
        } catch (error) {
          // 방 정보가 없거나 에러 발생 시 joinRoom 시도

          // 다른 에러가 발생했을 경우
          setAlertMessage("방 정보를 불러오는 중 오류가 발생했습니다.");
          navigate("/lounge");
        }
      };

      const joinRoom = async () => {
        try {
          const joinResponse = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/join-room`,
            {
              roomId,
              userId: user.uid,
              userName: user.displayName,
            },
          );
          if (joinResponse.status === 200) {
            navigate(`/room/${roomId}`);
          } else {
            setAlertMessage("방에 참여할 수 없습니다.");
            navigate("/lounge");
          }
        } catch (joinError) {
          const errorMessage =
            joinError?.response?.data?.message ||
            "An unexpected error occurred";
          setAlertMessage(errorMessage);
          navigate("/lounge");
        }
      };

      checkUserRoom();
    }
  }, [user, roomId, navigate, setAlertMessage]);
};

export default useUserRoomRedirect;
