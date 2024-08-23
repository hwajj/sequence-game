import admin from "firebase-admin";
import dotenv from "dotenv";

// .env 파일에서 환경 변수를 로드
dotenv.config();
//
// console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS);
const serviceAccount = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
);

// Firebase Admin SDK 초기화
admin.initializeApp({
  // credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

export default admin;
export const db = admin.database();
