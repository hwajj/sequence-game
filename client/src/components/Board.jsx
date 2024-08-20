import React from "react";

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

const Board = ({
  board,
  onCardClick,
  clickedCard,
  sequenceIndices,
  gameFinished,
}) => {
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
  return (
    <div className="grid grid-rows-10 gap-0 text-sm border-red mx-auto ">
      {board?.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-10 gap-0">
          {row.map((card, colIndex) => {
            // 카드의 무늬에 따라 글씨 색상 적용
            const isRedSuit =
              card.value.includes("♦") || card.value.includes("♥");
            const textColor = isRedSuit ? "text-red-600" : "text-gray-800";

            return (
              <div
                key={colIndex}
                className={`relative border-2 border-gray-400 h-[2.5rem] w-[2.9rem] 
                ${clickedCard === card.value ? "bg-yellow-100 transition-colors duration-75" : "bg-gray"}
                  ${isSequence(rowIndex, colIndex) ? "bg-yellow-300" : ""}   
                cursor-pointer flex items-center justify-center`}
                onClick={() =>
                  handleCardClick(card.value, [rowIndex, colIndex])
                }
              >
                <span className={textColor}>{card.value}</span>
                {/* 칩을 표현하는 원(circle) */}
                <div
                  className={`absolute w-4 h-4 rounded-full ${getChipStyle(card.occupiedColor)}`}
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
