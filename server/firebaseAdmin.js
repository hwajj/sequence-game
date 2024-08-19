import admin from "firebase-admin";
import dotenv from "dotenv";

// .env 파일에서 환경 변수를 로드
dotenv.config();

// Firebase Admin SDK 초기화
admin.initializeApp({
  credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

export default admin;
export const db = admin.database();
