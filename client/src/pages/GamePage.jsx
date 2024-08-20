import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAtom } from "jotai";
import { userAtom } from "@/atoms/userAtom.js";
import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import Board from "@/components/Board.jsx";
import { faCrown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AlertMessage from "@/components/AlertMessage.jsx";
import { cardMap } from "@/util/constants.js";
import GameFinishedModal from "@/components/GameFinishedModal.jsx";
function GamePage() {
  const { roomId } = useParams();
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [room, setRoom] = useState(null);
  const dbInstance = getDatabase();
  const [players, setPlayers] = useState([]);
  const [host, setHost] = useState(null);
  const [board, setBoard] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [userCards, setUserCards] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [clickedCard, setClickedCard] = useState(null);
  const [winner, setWinner] = useState(null);
  const [sequenceIndices, setSequenceIndices] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const roomRef = ref(dbInstance, `rooms/${roomId}`); // 해당 방의 전체 경로 참조

    // 실시간 데이터 구독
    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        const roomData = snapshot.val();
        // players 배열이 존재하고 최소 한 명의 플레이어가 있을 때만 실행
        if (roomData) {
          setRoom(roomData);

          // players 객체를 배열로 변환 후 indexNumber로 정렬
          const players = Object.values(roomData.players).sort(
            (a, b) => a.indexNumber - b.indexNumber,
          );

          if (players.length) {
            setPlayers(players);
          }

          // isHost가 true인 플레이어를 찾아서 host 상태에 저장
          const hostPlayer = players.find((player) => player.isHost);
          if (hostPlayer) {
            setHost(hostPlayer.userId);
          }
          const currentPlayer = roomData.players[user.uid];
          if (currentPlayer && currentPlayer.cards) {
            setUserCards(currentPlayer.cards); // 서버에서 업데이트된 카드 상태 반영
          }

          //방장 update
          if (hostPlayer) {
            setHost(hostPlayer.userId);
          }
          // 보드가 업데이트
          if (roomData.board) {
            setBoard(roomData.board);
          }
          //currentTurn이 업데이트\
          if (roomData.currentTurn) {
            setCurrentTurn(roomData.currentTurn);
          }

          if (roomData.gameFinished) {
            // console.log(roomData);
            setGameFinished(roomData.gameFinished);
            setSequenceIndices(roomData.sequenceIndices);
            setWinner(roomData.winner);
            openModal();
          }
        } else {
          navigate("/lounge");
        }

        setLoading(false);
      },
      (error) => {
        console.log(error);
      },
    );

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, [roomId, user]);
  const leaveRoom = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/leave-room`,
        {
          roomId,
          userId: user.uid,
        },
      );
      console.log(response.data.message);
      setRoom(null);
      navigate("/lounge");
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const handleQuitGame = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/quit-game`,
        {
          roomId: roomId, // 실제 roomId를 여기에 입력
        },
      );
    } catch (error) {
      console.error("Failed to Quit game:", error);
    }
  };
  const handleStartGame = async () => {
    console.log(players);
    if (players.length % 2 === 1) {
      setAlertMessage("짝수 인원으로 게임을 시작할수 있습니다 ");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/start-game`,
        {
          roomId: roomId, // 실제 roomId를 여기에 입력
        },
      );

      setLoading(false);
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };
  // 카드 클릭 핸들러
  const handleCardClick = (card) => {
    if (gameFinished) setAlertMessage("게임이 끝났습니다");
    setClickedCard(card); // 클릭된 카드를 상태로 설정
  };

  const handlePlaceCard = async (card, position) => {
    if (gameFinished) {
      // setAlertMessage("게임이 끝났습니다!!");
      openModal();
      return;
    }
    // currentTurn일 때만 카드를 놓을 수 있음
    if (currentTurn !== user.uid) {
      setAlertMessage("차례가 아닙니다");
      return;
    }

    // 클릭된 카드가 null이거나 undefined인 경우
    if (!card) {
      setAlertMessage("유효하지 않은 카드입니다.");
      return;
    }

    if (board[position[0]][position[1]].protected) {
      setAlertMessage("이 위치는 시퀀스입니다");
      return;
    }
    // 클릭된 위치가 이미 점유된 경우 (J카드가 아닌 경우)
    if (board[position[0]][position[1]].occupiedColor && !card.includes("J")) {
      setAlertMessage("이미 채워져있습니다.");
      return;
    }
    // 사용자가 가지고 있는 카드 중 클릭한 보드의 카드가 없고, J도 아닌경우
    if (!userCards.includes(card) && !card.includes("J")) {
      setAlertMessage("가지고 있는 카드가 아닙니다.");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/place-card`,
        {
          roomId,
          userId: user.uid,
          card,
          position, // 위치 정보도 함께 전송
        },
      );
      // const { winner, gameFinished, sequenceIndices } = response.data;
      // console.log(winner);
      // console.log(gameFinished);
      // console.log(sequenceIndices);
    } catch (error) {
      console.error("Failed to place card:", error);
    }
    setClickedCard(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col flex-grow h-full gap-4">
      <div className="flex justify-between p-4 items-center">
        <h1 className="text-center w-full text-[1.rem] main-font">
          {room && room.roomName}
        </h1>
        {user.uid === host && (
          <button
            className={`border-blue-600 rounded-[.4rem] w-40 h-10 ml-auto ${
              room?.gameStarted && !room?.gameFinished
                ? "bg-gray-500"
                : "bg-green-500"
            }`}
            onClick={
              room?.gameStarted && !room?.gameFinished
                ? handleQuitGame
                : handleStartGame
            }
          >
            {room?.gameStarted && !room?.gameFinished
              ? "Quit Game"
              : "Start Game"}
          </button>
        )}
      </div>

      <div className="flex flex-col flex-wrap gap-4">
        <div className="flex justify-around items-center flex-grow">
          {players
            .slice(0, Math.ceil(players.length / 2))
            .map((player, index) => (
              <div
                key={index}
                className={`px-4 py-2 relative border-2 text-[.7rem] main-font min-w-20 text-center rounded-[.4rem]
              ${
                player.team === "orange"
                  ? "border-orange-300"
                  : player.team === "blue"
                    ? "border-blue-300"
                    : "border-gray-200"
              }
              ${currentTurn === player.userId && (player.team === "orange" ? "bg-orange-400" : "bg-blue-100")} `}
              >
                {player.userName}
                {player.userId === host && (
                  <span className="absolute text-yellow-400 top-0 right-1">
                    <FontAwesomeIcon icon={faCrown} />
                  </span>
                )}
              </div>
            ))}
        </div>
        <Board
          board={board}
          onCardClick={handlePlaceCard}
          clickedCard={clickedCard}
          sequenceIndices={sequenceIndices}
          gameFinished={gameFinished}
        />
        <div className="flex justify-around items-center flex-row-reverse flex-grow">
          {players.slice(Math.ceil(players.length / 2)).map((player, index) => (
            <div
              key={index}
              className={`px-4 py-2 relative border-2 text-[.7rem] main-font min-w-20 text-center rounded-[.4rem] 
                 ${
                   player.team === "orange"
                     ? "border-orange-300"
                     : player.team === "blue"
                       ? "border-blue-300"
                       : "border-gray-200"
                 }
                ${currentTurn === player.userId && (player.team === "orange" ? "bg-orange-400" : "bg-blue-100")} `}
            >
              {player.userName}
              {player.userId === host && (
                <span className="absolute text-yellow-400 top-0 right-1">
                  <FontAwesomeIcon icon={faCrown} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div
        className={
          "flex flex-wrap overflow-auto gap-6 py-2 justify-center items-center"
        }
      >
        {userCards?.map((card, index) => (
          <img
            key={index}
            className={`no-select ${clickedCard === card && "-translate-y-[.3rem]"} transition-transform duration-150 
             lg:w-32 lg:h-36 w-24 h-32`}
            src={`/cards/${card}.svg`}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>
      <div>
        {players.map(
          (player, index) =>
            player.userId === currentTurn && (
              <p key={index}> {player.userName}님의 차례입니다 </p>
            ),
        )}
        {clickedCard && clickedCard.includes("J") && (
          <ul>
            <li>J 카드는 J카드의 규칙이 있습니다.</li>
            <li>
              정면을 바라보는 J 카드 (♣,♦) 인 경우 원하는 위치에 놓을 수
              있습니다{" "}
            </li>
            <li>
              옆을 바라보는 J 카드 (♥,♠) 인 경우 상대방의 칩을 제거할 수
              있습니다. 있습니다{" "}
            </li>
          </ul>
        )}
      </div>
      <div className={"mt-auto border-blue flex justify-between items-center"}>
        <button
          onClick={leaveRoom}
          className={
            "text-white mt-auto px-2 h-10  rounded-sm main-font bg-gray-500 "
          }
        >
          나가기
        </button>
      </div>
      <GameFinishedModal
        isOpen={isModalOpen}
        onClose={closeModal}
        winner={winner}
      />
      {/*알림메시지 컴포넌트*/}
      <AlertMessage
        message={alertMessage}
        duration={1000}
        onClose={() => setAlertMessage("")}
      />
    </div>
  );
}

export default GamePage;
