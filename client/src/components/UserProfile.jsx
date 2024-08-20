import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { userAtom } from "@/atoms/userAtom";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig.js";
import { useNavigate } from "react-router-dom";

function UserProfile() {
  const [user] = useAtom(userAtom);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div ref={dropdownRef}>
      <div
        onClick={toggleDropdown}
        className="flex items-center bg-transparent"
      >
        <img
          src={user.photoURL}
          alt="Profile"
          className="w-5 h-5 rounded-full mr-3"
        />
        <span className="text-sm">{user.displayName}</span>
      </div>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-md shadow-lg z-50">
          <button
            onClick={handleLogout}
            className="block text-left px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
