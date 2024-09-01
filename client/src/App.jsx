import React, { useEffect } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import AlertMessage from "@/components/AlertMessage.jsx";
import LoginPage from "@/pages/LoginPage";
import LoungePage from "@/pages/LoungePage.jsx";
import MainLayout from "@/layout/MainLayout.jsx";
import SplashPage from "@/pages/SplashPage.jsx";
import GameTutorialModal from "@/components/GameTutorialModal.jsx";
import GamePage from "@/pages/GamePage.jsx";
import ReactGA from "react-ga4";

// GA 초기화는 한 번만 실행
if (!window.GA_INITIALIZED) {
  const trackingId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (trackingId) {
    ReactGA.initialize(trackingId);
    window.GA_INITIALIZED = true;
  } else {
    console.warn("GA Tracking ID is not defined");
  }
}

function App() {
  return (
    <Router>
      <Analytics />
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

function Analytics() {
  const location = useLocation();
  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname + location.search,
    });
    // console.log(`Page viewed: ${location.pathname + location.search}`);
  }, [location]);

  return null;
}
