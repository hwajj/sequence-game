import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Realtime Database 초기화

const firebaseConfig = {
  apiKey: "AIzaSyCvOihw1MsNnkSlzn1uHDM4bIw_K-8GbVE",
  authDomain: "sequence-game-ad037.firebaseapp.com",
  projectId: "sequence-game-ad037",
  storageBucket: "sequence-game-ad037.appspot.com",
  messagingSenderId: "469533649181",
  appId: "1:469533649181:web:de42e7b3dca515ad8fd9f4",
  measurementId: "G-4ZNBJN15HY",
  databaseURL:
    "https://sequence-game-ad037-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app); // Realtime Database 인스턴스 초기화
