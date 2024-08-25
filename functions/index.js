import functions from "firebase-functions";
import express from "express";
import cors from "cors";
import admin from "./firebaseAdmin.js";
import "dotenv/config";
import {
  createRoom,
  joinRoom,
  getRooms,
  leaveRoom,
  setTotalPlayers,
  userRoom,
} from "./rooms.js";

import { startGame, quitGame, placeCard } from "./game.js";


const app = express();
app.use(cors());
app.use(express.json());

// 방 목록 가져오기
app.get("/rooms", getRooms);

app.get("/userRoom", userRoom);

// 방 생성
app.post("/create-room", createRoom);

app.post("/set-total-players", setTotalPlayers);

// 방 참여
app.post("/join-room", joinRoom);

// 방 나가기
app.post("/leave-room", leaveRoom);

// 로그인
app.post("/api/login", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) {
    return res.status(400).send({ message: "Token not provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    res.status(200).send({ message: "Login successful", uid });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).send({ message: "Unauthorized" });
  }
});

//게임 시작
app.post("/start-game", startGame);

//게임중단
app.post("/quit-game", quitGame);

//place Card
app.post("/place-card", placeCard);


if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}



// Firebase Functions로 내보내기
export const api = functions.https.onRequest(app);









