import admin from "firebase-admin";
import dotenv from "dotenv";

// .env 파일에서 환경 변수를 로드
dotenv.config();

const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
});

export default admin;
export const db = admin.database();