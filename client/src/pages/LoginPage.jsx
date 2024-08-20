import React, { useEffect } from "react";
import { auth, provider } from "@/firebaseConfig.js";
import { signInWithPopup, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom } from "@/atoms/userAtom";

function LoginPage() {
  const [user, setUser] = useAtom(userAtom);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        navigate("/lounge");
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="flex gap-10 m-auto flex-col justify-center items-center">
      <p className="text-[.8rem] text-center">
        간편한 구글 로그인으로 게임을 즐기실 수 있습니다.
      </p>
      {!user ? (
        <button
          className="bg-black text-white p-2 rounded-xl"
          onClick={handleGoogleLogin}
        >
          Login with Google
        </button>
      ) : (
        <button onClick={handleLogout}>Logout</button>
      )}
    </div>
  );
}

export default LoginPage;
