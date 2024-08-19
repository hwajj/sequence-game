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
  startGame,
} from "./rooms.js";
const app = express();
app.use(cors());
app.use(express.json());

// 방 목록 가져오기
app.get("/rooms", getRooms);

app.get("/userRoom", async (req, res) => {
  try {
    const { userId } = req.query;

    const userRoomRef = admin.database().ref(`userRooms/${userId}`);
    const userRoomSnapshot = await userRoomRef.once("value");
    const userRoomData = userRoomSnapshot.val();

    if (!userRoomData) {
      return res.status(404).send({ error: "No room found for this user" });
    }

    res.status(200).send(userRoomData);
  } catch (error) {
    console.error("Error fetching user room:", error);
    res.status(500).send({ error: "Failed to fetch user room" });
  }
});

// 방 생성
app.post("/create-room", createRoom);

app.post("/set-total-players", setTotalPlayers);

app.post("/start-game", startGame);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
