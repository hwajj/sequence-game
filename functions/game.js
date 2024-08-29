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
      return res.status(404).send({ error: "게임이 시작하지 않았습니다." });
    }

    // 현재 턴이 맞는지 확인
    if (roomData.currentTurn !== userId) {
      return res.status(400).send({ error: "차례가 아닙니다" });
    }
    // 카드가 플레이어의 카드에 있는지 확인
    const player = roomData.players[userId];

    if (!player.cards.includes(card)) {
      return res.status(400).send({ error: "가지고 있지 않은 카드입니다" });
    }

    // 보드 상태 업데이트 (전송된 위치를 기준으로)
    const [row, col] = position;

    // return;
    // J 카드에 대한 규칙 적용
    if (card.includes("J")) {
      // console.log(card + " in player's hand J'");
      if (card.includes("♠") || card.includes("♥")) {
        // 상대방의 칩을 제거하는 J 카드 (♠,♥)
        // console.log(card + 'card.includes("♠") || card.includes("♥")');
        const targetPosition = roomData.board[row][col];
        if (targetPosition.isSequence) {
          return res.status(400).send({ error: "여기는 이미 시퀀스입니다" });
        }
        if (targetPosition && targetPosition.occupiedColor) {
          if (targetPosition.occupiedColor !== player.team) {
            targetPosition.occupiedColor = ""; // 상대방의 칩 제거
          } else {
            return res
              .status(400)
              .send({ error: "옆을 보는 J 카드의 규칙을 확인하세요" });
          }
        }
      } else if (card.includes("♦") || card.includes("♣")) {
        console.log(card + 'card.include"♦") || card.includes("♣"');
        // 자신의 칩을 원하는 위치에 놓는 J 카드 (♦,♣)
        const targetPosition = roomData.board[row][col];
        console.log(targetPosition);
        if (targetPosition && !targetPosition.occupiedColor) {
          targetPosition.occupiedColor = player.team;
        } else if (targetPosition && targetPosition.occupiedColor) {
          return res
            .status(400)
            .send({ error: "앞을 보는 J 카드의 규칙을 확인하세요" });
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
    // console.log(sequenceIndices);
    // sequenceIndices를 사용하여 roomData.board의 isSequence를 업데이트
    sequenceIndices.forEach((sequence) => {
      sequence.forEach(([r, c]) => {
        roomData.board[r][c].isSequence = true;
      });
    });

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
// canFormSequence 함수 제거
export const checkWin = (board, playerTeam) => {
  let sequenceIndices = [];
  let sequenceCount = 0;
  const boardSize = 10;
  const sequenceLength = 5; // 시퀀스의 길이

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
    sequenceIndices.push(indices);
  };

  const checkAndAddSequence = (sequence) => {
    // console.log("checkAndAddSequence ,sequence");
    // console.log(sequence);

    if (sequence.length === sequenceLength) {
      if (!isDuplicateSequence(sequence)) {
        // console.log("!isDuplicateSequence(sequence)");
        if (isSameLineWithExisting(sequence)) {
          // console.log("isSameLineWithExisting");
          const mergedSequence = mergeSequences(sequence);

          if (mergedSequence.length === 10) {
            // console.log("mergedSequence.length === 10    ");
            sequenceCount++;
            addSequenceIndices(sequence);
            sequence.forEach(([r, c]) => {
              tempBoard[r][c].isSequence = true; // 시퀀스 위치 업데이트
            });
          }
        } else {
          sequenceCount++;
          addSequenceIndices(sequence);
          sequence.forEach(([r, c]) => {
            tempBoard[r][c].isSequence = true; // 시퀀스 위치 업데이트
          });
          //console.log(sequenceCount,
          // console.log(sequence)
        }
      } else {
        // console.log("중복시퀀스 ");
      }
    } else {
      // console.log("길이가 아직 5개 안됨");
    }
  };

  const isDuplicateSequence = (newSequence) => {
    return sequenceIndices.some((existingSequence) => {
      let overlapCount = 0;

      // 새 시퀀스의 각 위치를 기존 시퀀스와 비교하여 겹치는 위치를 계산
      newSequence.forEach(([newR, newC]) => {
        if (existingSequence.some(([r, c]) => r === newR && c === newC)) {
          overlapCount++;
        }
      });

      // 겹치는 위치가 두 개 이상일 경우 중복으로 간주
      return overlapCount >= 2;
    });
  };

  const isSameLineWithExisting = (sequence) => {
    // console.log("isSameLineWithExisting");
    // console.log(sequence);

    return sequenceIndices.some((existingSequence) => {
      // console.log("isSameLineWithExisting existing sequence");
      // console.log(existingSequence);

      // 같은 행에 있는지 확인: 행이 모두 동일한 경우
      const isSameRow = existingSequence.every(([r]) =>
        sequence.every(([seqR]) => seqR === r),
      );

      // 같은 열에 있는지 확인: 열이 모두 동일한 경우
      const isSameCol = existingSequence.every(([, c]) =>
        sequence.every(([, seqC]) => seqC === c),
      );

      // 같은 대각선에 있는지 확인
      const isDiagonal =
        existingSequence.every(
          ([r, c], i) => r - c === sequence[0][0] - sequence[0][1],
        ) ||
        existingSequence.every(
          ([r, c], i) => r + c === sequence[0][0] + sequence[0][1],
        );

      // console.log("isSameRow", isSameRow);
      // console.log("isSameCol", isSameCol);
      // console.log("isDiagonal", isDiagonal);
      return isSameRow || isSameCol || isDiagonal;
    });
  };

  const mergeSequences = (sequence) => {
    const merged = new Set();
    sequence.forEach(([r, c]) => merged.add(`${r},${c}`));

    sequenceIndices.forEach((existingSequence) => {
      existingSequence.forEach(([r, c]) => merged.add(`${r},${c}`));
    });

    return Array.from(merged).map((coord) => coord.split(",").map(Number));
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

  return { sequenceCount, sequenceIndices };
};
