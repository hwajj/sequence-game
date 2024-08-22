import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom"; // React Router 사용 시 필요
import UserProfile from "@/components/UserProfile.jsx";
import { userAtom } from "@/atoms/userAtom.js";
import { useAtom } from "jotai";
import { auth } from "@/firebaseConfig.js";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isGameTutorialModalOpenAtom } from "@/atoms/modalAtom.js";

function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useAtom(userAtom);
  const [isOpen, setIsOpen] = useAtom(isGameTutorialModalOpenAtom);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate, setUser]);
  return (
    <div className="flex flex-col min-h-screen ">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <div className="text-sm logo-font font-bold">
          {/* 좌측상단 로고 */}
          <a className="" href="/">
            Sequence
          </a>
        </div>
        <div className="flex ">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white logo-font px-4  cursor-pointer text-[.6rem] my-auto"
          >
            게임방법
          </button>
          {/* 우측상단 프로필 */}
          {user && <UserProfile />}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-grow logo-font flex relative overflow-auto">
        <div className="w-full mx-auto">
          <Outlet /> {/* 페이지별 컨텐츠가 들어가는 부분 */}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-[.4rem] p-2 bg-gray-800 text-white text-center">
        &copy; 2024 Jeong. All rights reserved.
      </footer>
    </div>
  );
}

export default Layout;
