import React, { createContext, useState } from "react";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [map, setMap] = useState("floresta");
  const [birds, setBirdsSound] = useState(true);
  const [wind, setWindSound] = useState(true);
  const [music, setMusicSound] = useState(true);
  const [isBreathingEnabled, setIsBreathingEnabled] = useState(true);
  const [corgiVisible, setCorgiVisible] = useState(true);
  const [corgiFollows, setCorgiFollows] = useState(true);

  return (
    <SettingsContext.Provider value={{
      map, setMap,
      birds, setBirdsSound,
      wind, setWindSound,
      music, setMusicSound,
      isBreathingEnabled, setIsBreathingEnabled,
      corgiVisible, setCorgiVisible,
      corgiFollows, setCorgiFollows
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
