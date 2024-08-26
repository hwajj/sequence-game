// 게임 시작
import { db } from "./firebaseAdmin.js";
import { BOARD } from "./data.js";
import admin from "firebase-admin";

export const startGame = async (req, res) => {
  try {
    const { roomId } = req.body;
    const roomRef = db.ref(`rooms/${roomId}`);
    const roomSnapshot = await roomRef.once("value");
    const roomData = roomSnapshot.val();

    if (!roomData) {
      return res.status(404).send({ error: "Room not found" });
    }
    // if (roomData.gameStarted) {
    //   return res.status(400).send({ error: "Game already started" });
    // }

    const players = Object.values(roomData.players || {});

    // 플레이어 정렬
    players.sort((a, b) => a.indexNumber - b.indexNumber); // indexNumber로 정렬
    // console.log(players);

    // 덱 생성 및 섞기
    const initialDeck = createDeck();
    const shuffledDeck = shuffleDeck(initialDeck);
    // 플레이어 수에 따른 카드 수 계산
    const playerCount = players.length;
    let cardsPerPlayer = 0;

    if (playerCount === 2) {
      cardsPerPlayer = 7;
    } else if (playerCount === 4) {
      cardsPerPlayer = 6;
    } else if (playerCount === 6) {
      cardsPerPlayer = 5;
    } else if (playerCount >= 8) {
      cardsPerPlayer = 4;
    } else {
      cardsPerPlayer = 3;
    }

    //팀 지정
    players.forEach((player, index) => {
      player.team = index % 2 === 0 ? "blue" : "orange";
      player.cards = shuffledDeck.splice(0, cardsPerPlayer);
    });

    const updatedPlayers = {};

    players.forEach((player) => {
      updatedPlayers[player.userId] = player;
    });

    // 첫 번째 플레이어를 currentTurn으로 설정
    const currentTurn = players[0].userId;

    await roomRef.update({
      gameStarted: true,
      players: updatedPlayers,
      board: BOARD,
      deck: shuffledDeck,
      currentTurn: currentTurn,
      gameFinished: false, // 게임이 다시 시작되므로 종료 상태 해제
      sequenceIndies: [],
    });

    // 클라이언트에 게임 시작 알림과 함께 업데이트된 데이터를 전송
    res.status(200).send({
      message: "Game started",
      sequenceIndices: [],
      // players: updatedPlayers,
      currentTurn,
    });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).send({ error: "Failed to start game" });
  }
};

export const quitGame = async (req, res) => {
  try {
    const { roomId } = req.body;

    // 방 참조
    const roomRef = admin.database().ref(`rooms/${roomId}`);
    const roomSnapshot = await roomRef.once("value");
    const roomData = roomSnapshot.val();

    if (!roomData) {
      return res.status(404).send({ error: "Room not found" });
    }

    // 게임이 이미 시작되었는지 확인
    if (!roomData.gameStarted) {
      return res.status(400).send({ error: "Game has not started yet." });
    }

    // 게임 중단 처리
    await roomRef.update({
      gameStarted: false,
      winner: null, // 승자가 없음을 의미
      board: null, // 보드를 초기화하거나 지울 수 있음
    });

    // 클라이언트에 게임 중단 상태 전송
    res
      .status(200)
      .send({ message: "Game has been quit.", gameStarted: false });
  } catch (error) {
    console.error("Error quitting game:", error);
    res.status(500).send({ error: "Failed to quit game" });
  }
};

// game 로직

export function createDeck() {
  // 기존 카드 덱에서 조커 제거
  const suits = ["♠", "♣", "♦", "♥"];
  const values = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];
  const deck = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push(`${value}${suit}`);
    }
  }

  return deck.concat(deck); // deck 2번추가
}
// 카드 덱을 섞는 함수
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export const placeCard = async (req, res) => {
  try {
    const { roomId, userId, card, position } = req.body;

    // 방 데이터 가져오기
    const roomRef = db.ref(`rooms/${roomId}`);
    const roomSnapshot = await roomRef.once("value");
    const roomData = roomSnapshot.val();

    if (!roomData) {
      return res.status(404).send({ error: "Room not found" });
    }

    if (!roomData.board) {
      return res.status(404).send({ error: "Game not started!" });
    }

    // 현재 턴이 맞는지 확인
    if (roomData.currentTurn !== userId) {
      return res.status(400).send({ error: "It's not your turn" });
    }
    // 카드가 플레이어의 카드에 있는지 확인
    const player = roomData.players[userId];

    if (!player.cards.includes(card)) {
      return res.status(400).send({ error: "Card not in player's hand" });
    }

    // 보드 상태 업데이트 (전송된 위치를 기준으로)
    const [row, col] = position;

    // J 카드에 대한 규칙 적용
    if (card.includes("J")) {
      // console.log(card + " in player's hand J'");
      if (card.includes("♠") || card.includes("♥")) {
        // 상대방의 칩을 제거하는 J 카드 (♠,♥)
        // console.log(card + 'card.includes("♠") || card.includes("♥")');
        const targetPosition = roomData.board[row][col];
        // console.log(targetPosition);
        if (
          targetPosition &&
          targetPosition.occupiedColor &&
          !targetPosition.protected &&
          targetPosition.occupiedColor !== player.team
        ) {
          targetPosition.occupiedColor = ""; // 상대방의 칩 제거
        }
      } else if (card.includes("♦") || card.includes("♣")) {
        console.log(card + 'card.include"♦") || card.includes("♣"');
        // 자신의 칩을 원하는 위치에 놓는 J 카드 (♦,♣)
        const targetPosition = roomData.board[row][col];
        console.log(targetPosition);
        if (targetPosition && !targetPosition.occupiedColor) {
          targetPosition.occupiedColor = player.team;
        }
      }
    } else {
      // 일반적인 카드에 대한 처리
      // console.log(roomData.board, row, col)
      if (!roomData.board[row] || !roomData.board[row][col]) {
        return res.status(400).send({ error: "Invalid board position" });
      }
      roomData.board[row][col].occupiedColor = player.team;
    }

    // console.log(player.cards)

    // 플레이어가 제출한 카드 제거
    const cardIndex = player.cards.findIndex((c) => c === card);
    if (cardIndex !== -1) {
      player.cards.splice(cardIndex, 1);
    } else {
      return res.status(400).send({ error: "Card not found in hand" });
    }

    const { sequenceCount, sequenceIndices } = checkWin(
      roomData.board,
      player.team,
    );

    // 시퀀스가 두 개 완성된 경우
    if (sequenceCount >= 2) {
      roomData.winner = player.team; // 승리 팀 설정
      roomData.gameFinished = true; // 게임 종료 상태 설정
    }

    // 다음 턴 설정 (순환)
    let players = Object.values(roomData.players).sort(
      (a, b) => a.indexNumber - b.indexNumber,
    );
    // 다음 턴 설정 (순환)
    if (players.length === 0) {
      return res.status(400).send({ error: "No players in room" });
    }
    // console.log(currentIndex);

    const currentIndex = players.findIndex((p) => {
      // console.log("current index " + p.userName + "");
      return p.userId === userId;
    });
    if (currentIndex === -1) {
      return res.status(400).send({ error: "Current player not found" });
    }

    const nextIndex = (currentIndex + 1) % players.length;
    const nextTurn = players[nextIndex].userId;

    // 덱에서 새 카드 나누기
    if (roomData.deck.length > 0) {
      player.cards.push(roomData.deck.pop());
    } else {
      return res.status(400).send({ error: "No cards left in deck" });
    }

    // 업데이트 저장
    await roomRef.update({
      board: roomData.board,
      players: roomData.players,
      deck: roomData.deck,
      currentTurn: nextTurn,
      winner: roomData.winner || null,
      gameFinished: roomData.gameFinished || false,
      sequenceIndices: roomData.gameFinished ? sequenceIndices : [],
    });

    res.status(200).send({
      message: "Card placed successfully",
      board: roomData.board,
      // players: roomData.players,
      currentTurn: nextTurn,
      winner: roomData.winner || null,
      gameFinished: roomData.gameFinished || false,
      sequenceIndices: sequenceIndices,
    });
  } catch (error) {
    console.error("Error placing card:", error);
    res.status(500).send({ error: "Failed to place card" });
  }
};
export const checkWin = (board, playerTeam) => {
  let sequenceIndices = [];
  let sequenceCount = 0;
  const boardSize = 10;
  const sequenceLength = 5; // 시퀀스의 길이

  // 임시 보드를 생성하여 조커 위치 같은색으로
  const tempBoard = board.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (
        (rowIndex === 0 && colIndex === 0) ||
        (rowIndex === 0 && colIndex === 9) ||
        (rowIndex === 9 && colIndex === 0) ||
        (rowIndex === 9 && colIndex === 9)
      ) {
        return { ...cell, occupiedColor: playerTeam };
      }
      return cell;
    }),
  );

  const addSequenceIndices = (indices) => {
    sequenceIndices.push(...indices);
  };

  const checkAndAddSequence = (sequence) => {
    if (sequence.length === sequenceLength) {
      if (!isDuplicateSequence(sequence)) {
        sequenceCount++;
        addSequenceIndices(sequence);
      }
    }
  };

  const isDuplicateSequence = (newSequence) => {
    return sequenceIndices.some(([r, c]) =>
      newSequence.some(([newR, newC]) => r === newR && c === newC),
    );
  };

  const canFormSequence = (r, c, x, y) => {
    const endRow = r + (sequenceLength - 1) * y;
    const endCol = c + (sequenceLength - 1) * x;
    return (
      endRow >= 0 && endRow < boardSize && endCol >= 0 && endCol < boardSize
    );
  };

  const directions = [
    { x: 1, y: 0 }, // 가로
    { x: 0, y: 1 }, // 세로
    { x: 1, y: 1 }, // 대각선 /
    { x: 1, y: -1 }, // 대각선 \
  ];

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const color = tempBoard[row][col].occupiedColor;

      if (!color || color !== playerTeam) continue;

      for (const { x, y } of directions) {
        if (!canFormSequence(row, col, x, y)) continue;

        let potentialSequence = [];
        let r = row;
        let c = col;

        while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
          if (tempBoard[r][c].occupiedColor === color) {
            potentialSequence.push([r, c]);
            if (potentialSequence.length === sequenceLength) {
              checkAndAddSequence(potentialSequence);
              break;
            }
          } else {
            break;
          }
          r += y;
          c += x;
        }
      }
    }
  }

  // 마지막으로, 10개의 칩이 모두 채워진 경우 시퀀스 2개로 간주
  const checkFullSequence = (sequence) => {
    if (sequence.length === 10) {
      checkAndAddSequence(sequence.slice(0, sequenceLength));
      checkAndAddSequence(sequence.slice(sequenceLength));
    }
  };

  // 가로, 세로, 대각선 전체가 채워졌을 때 시퀀스 2개로 간주
  for (let row = 0; row < boardSize; row++) {
    let fullSequence = [];
    for (let col = 0; col < boardSize; col++) {
      if (tempBoard[row][col].occupiedColor === playerTeam) {
        fullSequence.push([row, col]);
      }
    }
    if (fullSequence.length === boardSize) {
      checkFullSequence(fullSequence);
    }
  }

  for (let col = 0; col < boardSize; col++) {
    let fullSequence = [];
    for (let row = 0; row < boardSize; row++) {
      if (tempBoard[row][col].occupiedColor === playerTeam) {
        fullSequence.push([row, col]);
      }
    }
    if (fullSequence.length === boardSize) {
      checkFullSequence(fullSequence);
    }
  }

  let diagonal1 = [];
  let diagonal2 = [];
  for (let i = 0; i < boardSize; i++) {
    if (tempBoard[i][i].occupiedColor === playerTeam) {
      diagonal1.push([i, i]);
    }
    if (tempBoard[i][boardSize - i - 1].occupiedColor === playerTeam) {
      diagonal2.push([i, boardSize - i - 1]);
    }
  }
  if (diagonal1.length === boardSize) {
    checkFullSequence(diagonal1);
  }
  if (diagonal2.length === boardSize) {
    checkFullSequence(diagonal2);
  }

  return { sequenceCount, sequenceIndices };
};
