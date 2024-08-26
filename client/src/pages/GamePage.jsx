import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAtom, useSetAtom } from "jotai";
import { userAtom } from "@/atoms/userAtom.js";
import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import Board from "@/components/Board.jsx";
import { faCrown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BOARD } from "@/util/constants.js";
import GameFinishedModal from "@/components/GameFinishedModal.jsx";
import QuitGameModal from "@/components/QuitGameModal.jsx";
import useJoinRoomOnUrlAccess from "@/hook/useJoinRoomOnUrlAccess.js";
import { alertMessageAtom } from "@/atoms/alertAtoms.js";
import { truncateName } from "@/util/util.js";
function GamePage() {
  const { roomId } = useParams();
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const dbInstance = getDatabase();
  const [players, setPlayers] = useState([]);
  const [host, setHost] = useState(null);
  const [board, setBoard] = useState(BOARD);
  const [userCards, setUserCards] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [clickedCard, setClickedCard] = useState(null);
  const [winner, setWinner] = useState(null);
  const [sequenceIndices, setSequenceIndices] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [isGameFinishedOpen, setGameFinishedOpen] = useState(false);
  const [isQuitGameOpen, setQuitGameOpen] = useState(false);
  const setAlertMessage = useSetAtom(alertMessageAtom);
  const [gameStarted, setGameStarted] = useState(false);

  // GamePage 컴포넌트 내에서 사용
  useJoinRoomOnUrlAccess(user, setAlertMessage);
  useEffect(() => {
    if (!user) {
      return;
    }

    const roomRef = ref(dbInstance, `rooms/${roomId}`); // 해당 방의 전체 경로 참조

    let previousPlayerCount = 0;
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
            if (roomData.gameStarted) {
              setGameStarted(true); //대기중 -> 게임 중
              setUserCards(currentPlayer.cards);
              setGameFinished(false);
            } else {
              setBoard(BOARD); // 개임 중단 시 보드 상태 리셋
              setGameStarted(false); //게임 시작 => 대기중
              setTimeout(() => {
                setUserCards(currentPlayer.cards); // 서버에서 업데이트된 카드 상태 반영
              }, 300); // 500ms 지연
            }
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

          if (roomData.gameStarted) {
            setSequenceIndices([]);
          }

          // 플레이어 수를 감지하여 플레이어가 줄어든 경우 처리
          if (players.length < previousPlayerCount && roomData.gameStarted) {
            if (players.length > 2) {
              setAlertMessage(
                `플레이어가 나가서 게임이 중단되었습니다. ${roomData.winner} 팀 승리.`,
              );
            } else {
              setAlertMessage(
                `플레이어가 나가서 게임이 중단되었습니다. ${players[0].team} 팀 승리.`,
              );
            }
          }
          // 현재 플레이어 수 업데이트
          previousPlayerCount = players.length;

          if (roomData.gameFinished) {
            // console.log(roomData);
            setGameFinished(roomData.gameFinished);
            setSequenceIndices(roomData.sequenceIndices);
            setWinner(roomData.winner);
            setClickedCard(null);
            setGameFinishedOpen(true);
            setGameStarted(false);
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
      setRoom(null);
      navigate("/lounge");
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const handleQuitGame = () => {
    setQuitGameOpen(true);
    setBoard(BOARD);
  };

  const cancelQuitGame = () => {
    setQuitGameOpen(false);
  };
  const confirmQuitGame = async () => {
    setQuitGameOpen(false);

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
    setGameFinished(false);

    setSequenceIndices([]);

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
    // console.log(userCards);
    if (gameFinished) {
      // 게임끝났습니다 메시지 다시 보여주기
      setGameFinishedOpen(true);
    }

    setClickedCard(card); // 클릭된 카드를 상태로 설정
  };

  const handlePlaceCard = async (card, position) => {
    if (!gameStarted) {
      setAlertMessage(
        "게임이 아직 시작되지 않았습니다. 방장은 게임을 시작해주세요.",
      );
      return;
    }

    if (gameFinished) {
      // 게임끝났습니다 메시지 다시 보여주기
      setGameFinishedOpen(true);
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

    // 카드가 보드에 놓이면 위로 올리는 애니메이션 적용
    // setPlacedCards((prevPlacedCards) => [...prevPlacedCards, card]);
    // 카드가 놓인 후 2초 후에 뒤집기
    // setTimeout(() => {
    //   console.log("2초");
    //   setFlippedCards((prevFlippedCards) => [...prevFlippedCards, card]);
    //   console.log(card);
    // }, 2000);
    //    setFlippedCards((prevFlippedCards) => [...prevFlippedCards, card]);

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
    <div className="relative flex flex-col flex-grow h-full mx-auto max-w-[45rem] justify-around">
      <div className="flex rounded-sm justify-between p-2 lg:p-4 items-center">
        <h1 className="text-center xs:block hidden xs:text-[2rem] lg:text-[2.5rem] font-bold text-gray-800 main-font">
          {room && room.roomName}
        </h1>
        {user.uid === host ? (
          <button
            className={`border-blue-600 hidden xs:block rounded-[.25rem] w-20 h-10 lg:w-40 lg:h-10 ml-auto ${
              room?.gameStarted && !room?.gameFinished
                ? "bg-gray-500 text-white"
                : "bg-green-500"
            }`}
            onClick={
              room?.gameStarted && !room?.gameFinished
                ? handleQuitGame
                : handleStartGame
            }
          >
            {room?.gameStarted && !room?.gameFinished
              ? "게임 중단"
              : "게임 시작"}
          </button>
        ) : (
          <button className="pointer-events-none no-select">
            {" "}
            {room?.gameStarted && !room?.gameFinished
              ? "게임 중"
              : "대기 중"}{" "}
          </button>
        )}
      </div>
      <div className="text-sm sm:mb-2 lg:mb-4 hidden md:block ">
        {/*{userCards && userCards.some((item) => item.includes("J")) && (*/}
        <ul>
          <li>♣ &nbsp; J 카드는 J카드의 규칙이 있습니다.</li>
          <li>
            ♦ &nbsp; 정면을 바라보는 J 카드 (♣,♦) 인 경우 원하는 위치에 놓을
            수 있습니다.
          </li>
          <li>
            ♥ &nbsp; 옆을 바라보는 J 카드 (♥,♠) 인 경우 상대방의 칩을 제거할
            수 있습니다.
          </li>
          <li>
            ♠ &nbsp; J 카드를 사용하려면{" "}
            <span className={"text-red-500"}>J 카드 클릭 후 </span> 보드 위에서
            놓고싶은 위치를 선택하세요!!
          </li>
        </ul>
        {/*)}*/}
      </div>
      <div className="flex lg:flex-row flex-col gap-2 justify-evenly">
        {/*<div className="flex justify-around items-center flex-grow">*/}
        <div className="flex flex-row lg:flex-col px-4 justify-evenly items-center">
          {players
            // .slice(0, Math.ceil(players.length / 2))
            .map((player, index) => (
              <div
                key={index}
                className={`relative h-full lg:h-auto
                  text-[.7rem] p-2 mx-2 lg:text-[1rem] main-font  text-center rounded-[.25rem]
              ${
                currentTurn !== player.userId && player.team === "orange"
                  ? "bg-orange-100"
                  : player.team === "blue"
                    ? "bg-blue-100"
                    : ""
              }
              ${currentTurn === player.userId && (player.team === "orange" ? "shadow-neon-orange bg-orange-400" : "shadow-neon-blue bg-blue-300")} `}
              >
                {/*사용자 이름 */}
                <span className={"whitespace-wrap "}>
                  {truncateName(player.userName, 5)}
                </span>
                {player.userId === host && (
                  <span className="absolute text-yellow-400 top-0 right-1">
                    <FontAwesomeIcon icon={faCrown} />
                  </span>
                )}
              </div>
            ))}
        </div>
        <Board
          currentTurn={currentTurn}
          players={players}
          board={board}
          onCardClick={handlePlaceCard}
          clickedCard={clickedCard}
          sequenceIndices={sequenceIndices}
          gameFinished={gameFinished}
        />
        {/*<div className="flex justify-around items-center flex-row-reverse flex-grow">
          {players.slice(Math.ceil(players.length / 2)).map((player, index) => (
            <div
              key={index}
              className={`px-4 py-2 relative border-2 text-[.7rem] main-font min-w-20 text-center rounded-[.25rem]
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
        </div>*/}
      </div>
      <div className="flex flex-wrap justify-center gap-2 items-center mt-4 h-30">
        {userCards?.map((card, index) => (
          <img
            key={index}
            className={`no-select card
             ${clickedCard === card && "shadow-right-bottom -translate-x-[.2rem] "} transition-transform duration-500
             w-16 h-24 lg:w-24 lg:h-32`}
            alt={`Card ${card}`}
            src={`/cards/${card}.svg`}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>

      <div className={"my-2 flex justify-between items-center"}>
        <button
          onClick={leaveRoom}
          className={
            "text-white mt-auto p-2 text-sm md:text-xl md:h-10 rounded-[.25rem] main-font bg-gray-500 "
          }
        >
          나가기
        </button>
        {user.uid === host && (
          <button
            className={`border-blue-600 xs:hidden block rounded-[.25rem] text-sm p-2 ${
              room?.gameStarted && !room?.gameFinished
                ? "bg-gray-500 text-white"
                : "bg-green-500"
            }`}
            onClick={
              room?.gameStarted && !room?.gameFinished
                ? handleQuitGame
                : handleStartGame
            }
          >
            {room?.gameStarted && !room?.gameFinished
              ? "게임 중단"
              : "게임 시작"}
          </button>
        )}
      </div>
      <GameFinishedModal
        isOpen={isGameFinishedOpen}
        onClose={() => setGameFinishedOpen(false)}
        winner={winner}
      />

      <QuitGameModal
        isOpen={isQuitGameOpen}
        onClose={cancelQuitGame}
        onConfirm={confirmQuitGame}
      />
    </div>
  );
}

export default GamePage;
