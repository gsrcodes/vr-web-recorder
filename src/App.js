import React from "react";
import VrControl from "./components/VrControl";
import SoundSettings from "./components/SoundSettings";
import CorgiSettings from "./components/CorgiSettings";
import BreathingControl from "./components/BreathingControl";
import MapSettings from "./components/MapSettings";
import { SettingsProvider } from "./context/SettingsProvider";
import useVR from "./hooks/useVR";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const { isVRRunning, startVR, stopVR } = useVR();

  return (
    <SettingsProvider>
      <div className="container mt-5">
        <div className="card shadow-lg p-4">
          <h1 className="text-center text-primary mb-4">Realidade Virtual Web</h1>

          <VrControl isVRRunning={isVRRunning} startVR={startVR} stopVR={stopVR} />
          <MapSettings />
          <SoundSettings />
          <CorgiSettings />
          <BreathingControl />
          
        </div>
      </div>
    </SettingsProvider>
  );
}

export default App;
