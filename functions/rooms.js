import { db } from "./firebaseAdmin.js";
import shortid from "shortid";
import admin from "firebase-admin";
import { BOARD } from "./data.js";

export const createRoom = async (req, res) => {
  try {
    const roomId = shortid.generate(); // 짧은 방 ID 생성
    const { userId, userName, totalPlayers, roomName } = req.body;

    const newRoom = {
      roomName,
      roomId,
      indexNumber: 1,
      players: {
        [userId]: {
          userId,
          userName,
          isHost: true,
          indexNumber: 1,
        },
      },
      totalPlayers, // 방에서 설정한 최대 플레이어 수
      createdAt: new Date().toISOString(),
      gameStarted: false,
    };

    await admin.database().ref(`rooms/${roomId}`).set(newRoom);
    // 사용자의 현재 방 정보를 별도로 저장
    const userRoomRef = admin.database().ref(`userRooms/${userId}`);
    await userRoomRef.set({ roomId });

    res.status(200).send({ roomId });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).send({ error: "Failed to create room" });
  }
};

// 방 인원 설정 (짝수만 가능)
export const setTotalPlayers = async (req, res) => {
  try {
    const { roomId, totalPlayers } = req.body;
    const roomRef = db.ref(`rooms/${roomId}`);
    const roomSnapshot = await roomRef.once("value");
    const roomData = roomSnapshot.val();

    if (!roomData) {
      return res.status(404).send({ error: "Room not found" });
    }

    if (totalPlayers % 2 !== 0) {
      return res
        .status(400)
        .send({ error: "Total player count must be an even number." });
    }

    await roomRef.update({ totalPlayers });
    res.status(200).send({ message: "Total player count updated" });
  } catch (error) {
    console.error("Error setting total players:", error);
    res.status(500).send({ error: "Failed to set total player count" });
  }
};

export const getRooms = async (req, res) => {
  try {
    const roomsSnapshot = await db.ref("rooms").once("value");
    const roomsData = roomsSnapshot.val();

    // 방 목록이 없을 경우 빈 배열 반환
    if (!roomsData) {
      return res.status(200).send([]);
    }

    // 방 정보를 배열로 변환
    const roomsList = Object.keys(roomsData).map((roomId) => ({
      roomId,
      ...roomsData[roomId],
    }));

    res.status(200).send(roomsList);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).send({ error: "Failed to fetch rooms" });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { roomId, userId, userName } = req.body;

    const roomRef = db.ref(`rooms/${roomId}`);
    const roomSnapshot = await roomRef.once("value");

    if (!roomSnapshot.exists()) {
      return res.status(404).send({ message: "방을 찾을 수 없습니다" });
    }

    const roomData = roomSnapshot.val();
    // console.log(roomData);
    // 방의 조건 확인: 게임이 이미 시작되었거나, 플레이어가 8명을 초과한 경우
    if (roomData.gameStarted && !roomData.gameFinished) {
      return res.status(400).send({ message: "게임이 이미 시작했습니다." });
    }

    if (Object.keys(roomData.players || {}).length >= roomData.totalPlayers) {
      return res.status(403).send({ message: "방의 정원이 가득 찼습니다" });
    }
    // 새로운 플레이어에게 부여할 indexNumber 결정
    const newIndexNumber = ++roomData.indexNumber;

    const playerRef = roomRef.child(`players/${userId}`);
    await playerRef.set({
      userId,
      userName,
      isHost: false,
      indexNumber: newIndexNumber,
    });

    // roomData의 indexNumber를 증가
    await roomRef.update({ indexNumber: newIndexNumber });

    // user가 속한 방 번호
    await db.ref(`userRooms/${userId}`).set({ roomId });

    // await roomRef.update(roomData);
    // // 방 인원이 다 찼다면 게임 시작
    // if (roomData.players.length === roomData.totalPlayers) {
    //   await roomRef.update({ gameStarted: true });
    // }

    res.status(200).send({ roomId });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).send({ error: "Failed to join room" });
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const { roomId, userId } = req.body;

    const roomRef = admin.database().ref(`rooms/${roomId}`);
    const roomSnapshot = await roomRef.once("value");
    const roomData = roomSnapshot.val();

    if (!roomData) {
      return res.status(404).send({ error: "Room not found" });
    }

    const isHost = roomData.players[userId].isHost;

    // userRooms에서 사용자 정보 삭제 (앞으로 이동)
    const userRoomRef = admin.database().ref(`userRooms/${userId}`);
    await userRoomRef.remove();

    // 플레이어 목록에서 해당 플레이어를 제거
    const updatedPlayers = { ...roomData.players };
    delete updatedPlayers[userId];

    // 호스트가 나갔다면 가장 작은 indexNumber를 가진 플레이어에게 호스트 권한을 부여
    if (isHost && Object.keys(updatedPlayers).length > 0) {
      const newHostUserId = Object.keys(updatedPlayers).reduce(
        (prevId, currId) => {
          return updatedPlayers[prevId].indexNumber <
            updatedPlayers[currId].indexNumber
            ? prevId
            : currId;
        },
      );
      updatedPlayers[newHostUserId].isHost = true;
      // console.log(updatedPlayers);
      await roomRef.update({ players: updatedPlayers });
    } else {
      // 호스트가 아닌 경우에도 업데이트 적용
      await roomRef.update({ players: updatedPlayers });
    }

    // 방에 남아있는 플레이어가 없으면 방 삭제
    if (Object.keys(updatedPlayers).length === 0) {
      await roomRef.remove();
      return res
        .status(200)
        .send({ message: "Room removed, no players left." });
    }

    // 게임이 시작되었고 플레이어가 나간 경우 게임을 중단하고 승자를 결정
    if (roomData.gameStarted) {
      const leavingPlayer = roomData.players[userId];

      if (leavingPlayer) {
        const loserTeam = leavingPlayer.team;
        const remainingPlayers = Object.values(updatedPlayers);
        const winnerTeam =
          remainingPlayers.find((player) => player.team !== loserTeam)?.team ||
          null;

        await roomRef.update({
          gameStarted: false,
          winner: winnerTeam,
        });

        return res.status(200).send({
          message: `Player left, game stopped. Team ${winnerTeam} wins.`,
        });
      }
    }

    res.status(200).send({ message: "Player left the room." });
  } catch (error) {
    console.error("Error leaving room:", error);
    res.status(500).send({ error: "Failed to leave room" });
  }
};

export const userRoom = async (req, res) => {
  try {
    const { userId } = req.query;

    const userRoomRef = admin.database().ref(`userRooms/${userId}`);
    const userRoomSnapshot = await userRoomRef.once("value");
    const userRoomData = userRoomSnapshot.val();

    if (!userRoomData) {
      return res.status(200).send({ message: "No room found for this user" });

    }

    res.status(200).send(userRoomData);
  } catch (error) {
    console.error("Error fetching user room:", error);
    res.status(500).send({ error: "Failed to fetch user room" });
  }
};
