import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { userAtom } from "@/atoms/userAtom.js";
import classNames from "classnames";

const getChipStyle = (color) => {
  switch (color) {
    case "blue":
      return "bg-blue-500";
    case "orange":
      return "bg-orange-500";
    case "green":
      return "bg-green-200";
    default:
      return "hidden"; // 기본 배경 색상
  }
};

const getChipEffect = (color) => {
  switch (color) {
    case "blue":
      return "bg-blue-100";
    case "orange":
      return "bg-orange-100";
    case "green":
      return "bg-green-100";
    default:
      return "hidden"; // 기본 배경 색상
  }
};

const Board = ({
  currentTurn,
  players,
  board,
  onCardClick,
  clickedCard,
  sequenceIndices,
  gameFinished,
}) => {
  const [changedPositions, setChangedPositions] = useState([]);
  const [highlightedPositions, setHighlightedPositions] = useState({});
  const previousBoardRef = useRef(board);
  const [user] = useAtom(userAtom);
  const myTeamRef = useRef(null);

  myTeamRef.current =
    players.find((player) => player.userId === user.uid)?.team || null;

  useEffect(() => {
    const changedPositionsTemp = [];
    const newHighlightedPositions = {};

    for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
      for (let colIndex = 0; colIndex < board[rowIndex].length; colIndex++) {
        if (
          board[rowIndex][colIndex].occupiedColor !==
          previousBoardRef.current[rowIndex][colIndex].occupiedColor
        ) {
          changedPositionsTemp.push([rowIndex, colIndex]);
          newHighlightedPositions[`${rowIndex}-${colIndex}`] =
            board[rowIndex][colIndex].occupiedColor;
        }
      }
    }

    setChangedPositions(changedPositionsTemp);
    setHighlightedPositions(newHighlightedPositions);
    previousBoardRef.current = board; // 현재 보드를 이전 보드로 업데이트

    // 3초 후에 하이라이트 제거
    const timer = setTimeout(() => {
      setChangedPositions([]);
      setHighlightedPositions({});
    }, 3000);

    return () => clearTimeout(timer);
  }, [board]);

  const isSequence = (row, col) => {
    if (!sequenceIndices || !gameFinished) return;
    return sequenceIndices.some(
      ([sequenceRow, sequenceCol]) =>
        sequenceRow === row && sequenceCol === col,
    );
  };

  const handleCardClick = (card, position) => {
    if (card) {
      if (clickedCard?.includes("J")) {
        onCardClick(clickedCard, position);
      } else {
        onCardClick(card, position);
      }
    }
  };

  const getPlacedChipHighlight = (rowIndex, colIndex) => {
    const key = `${rowIndex}-${colIndex}`;
    const highlightColor = highlightedPositions[key];
    const color = `${getChipEffect(highlightColor)} `;
    return highlightColor ? color : "";
  };

  const isPlaceable = (card, rowIndex, colIndex) => {
    const teamColorClass = `bg-${myTeamRef.current}-200`;

    if (clickedCard?.includes("J")) {
      if (clickedCard.includes("♥") || clickedCard.includes("♠")) {
        // 하트 또는 스페이드 J카드: 상대팀의 칩만 제거 가능
        return classNames({
          [teamColorClass]:
            board[rowIndex][colIndex].occupiedColor &&
            board[rowIndex][colIndex].occupiedColor !== myTeamRef.current,
        });
      } else if (clickedCard.includes("♦") || clickedCard.includes("♣")) {
        // 다이아 또는 클럽 J카드: 빈 칸에만 놓을 수 있음
        return classNames({
          [teamColorClass]: board[rowIndex][colIndex].occupiedColor === "",
        });
      }
    } else if (clickedCard === card.value) {
      return classNames(`${teamColorClass} transition-colors`);
    }
    return "";
  };

  return (
    <div className="grid items-center justify-center rounded-sm mx-4 grid-rows-10 gap-0 text-[.7rem] xs:text-[.9rem] sm:text-lg lg:text-xl">
      {board?.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid items-center bg-gray-50 justify-center grid-cols-10 gap-0 rounded-sm"
        >
          {row.map((card, colIndex) => {
            // 카드의 무늬에 따라 글씨 색상 적용
            // 하트나 다이아면 빨간색.
            const isRedSuit =
              card.value.includes("♦") || card.value.includes("♥");
            const textColor = isRedSuit ? "text-red-600" : "text-gray-800";
            const placeableClass = isPlaceable(card, rowIndex, colIndex);

            return (
              <div
                key={colIndex}
                className={classNames(
                  "no-select relative border-[.09rem] overflow-hidden border-gray-300",
                  "w-[1.7rem] h-[1.7rem] xs:w-[2rem] xs:h-[2rem] sm:w-[2.5rem] sm:h-[2.5rem] lg:h-[3rem] rounded-sm",
                  placeableClass,
                  {
                    "bg-yellow-300": isSequence(rowIndex, colIndex),
                  },
                  getPlacedChipHighlight(rowIndex, colIndex),
                  "cursor-pointer flex items-center justify-center",
                )}
                onClick={() =>
                  handleCardClick(card.value, [rowIndex, colIndex])
                }
              >
                <span
                  className={classNames(textColor, {
                    "bg-gray-400 w-full h-full": card.value === "Joker",
                  })}
                >
                  {card.value !== "Joker" ? card.value : ""}
                </span>
                {/* 칩을 표현하는 원(circle) */}
                <div
                  className={classNames(
                    "absolute w-4 h-4 lg:w-5 lg:h-5 rounded-full",
                    getChipStyle(card.occupiedColor),
                  )}
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                ></div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Board;
