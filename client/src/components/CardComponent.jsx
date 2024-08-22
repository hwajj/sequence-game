import React, { useState } from "react";

const CardComponent = ({
  userCards,
  placedCards,
  clickedCard,
  handleCardClick,
}) => {
  const [flippedCardIndex, setFlippedCardIndex] = useState(null);

  const updateUserCards = (newCards) => {
    const previousCards = userCards;
    const newCardIndex = newCards.findIndex(
      (card) => !previousCards.includes(card),
    );

    if (newCardIndex !== -1) {
      setFlippedCardIndex(newCardIndex);

      // 일정 시간 후에 flipped 상태 초기화
      setTimeout(() => {
        setFlippedCardIndex(null);
      }, 1000); // 애니메이션 지속 시간에 맞게 조정
    }

    setUserCards(newCards);
  };

  return (
    <div className="card-container">
      {userCards?.map((card, index) => (
        <div
          key={index}
          className={`card 
            ${index === flippedCardIndex ? "flipped" : ""}
            ${placedCards.includes(card) ? "placed" : ""}
            ${clickedCard === card && "-translate-y-[.4rem]"}
            w-24 h-32`}
          onClick={() => handleCardClick(card)}
        >
          <div className="front">
            <img src={`/cards/${card}.svg`} alt={`Card ${card}`} />
          </div>
          <div className="back">
            <img src="/cards/back.svg" alt="Card back" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardComponent;
