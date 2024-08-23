import React from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AlertMessage from "@/components/AlertMessage.jsx";
import LoginPage from "@/pages/LoginPage";
import LoungePage from "@/pages/LoungePage.jsx";
import MainLayout from "@/layout/MainLayout.jsx";
import SplashPage from "@/pages/SplashPage.jsx";
import GameTutorialModal from "@/components/GameTutorialModal.jsx";
import GamePage from "@/pages/GamePage.jsx";

function App() {
  return (
    <Router>
      <AlertMessage />
      <GameTutorialModal />
      <Routes>
        <Route index path="/" element={<SplashPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/lounge" element={<LoungePage />} />
          <Route path="room/:roomId" element={<GamePage />} />
        </Route>

        <Route path="*" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
