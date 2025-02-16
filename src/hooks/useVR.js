import { useContext, useRef, useState, useEffect } from "react";
import { SettingsContext } from "../context/SettingsProvider";
import { postToUnity } from "../utils/postToUnity";

const useVR = () => {
  const {
    map,
    birds,
    wind,
    music,
    isBreathingEnabled,
    corgiVisible,
    corgiFollows
  } = useContext(SettingsContext);

  const [isVRRunning, setIsVRRunning] = useState(false);
  const vrWindowRef = useRef(null);

  const startVR = () => {
    const webglPath = `${window.location.origin}/vr-web-recorder/webgl/index.html?map=${map}&birds=${birds}&wind=${wind}&music=${music}&breathing=${isBreathingEnabled}&corgiVisible=${corgiVisible}&corgiFollows=${corgiFollows}`;
    const vrWin = window.open(webglPath, "_blank");
    vrWindowRef.current = vrWin;
    setIsVRRunning(true);
    console.log("🎮 VR iniciado");

    const interval = setInterval(() => {
      if (vrWindowRef.current?.closed) {
        console.log("🛑 Janela do VR fechada pelo usuário!");
        setIsVRRunning(false);  
        clearInterval(interval);
        vrWindowRef.current = null;
      }
    }, 1000);

    //setTimeout(() => postToUnity(vrWindowRef, { birds, wind, music, isBreathingEnabled, corgiVisible, corgiFollows }), 3000);
  };

  const stopVR = () => {
    if (vrWindowRef.current) {
      vrWindowRef.current.close();
      vrWindowRef.current = null;
    }
    setIsVRRunning(false);
    console.log("⛔ VR parado");

  };

  useEffect(() => {
    if (isVRRunning && vrWindowRef.current) {
      postToUnity(vrWindowRef, { birds, wind, music, isBreathingEnabled, corgiVisible, corgiFollows });
      console.log("🔄 Configurações enviadas para Unity", { birds, wind, music, isBreathingEnabled, corgiVisible, corgiFollows });
    }
  }, [birds, wind, music, isBreathingEnabled, corgiVisible, corgiFollows, isVRRunning]);

  return { isVRRunning, startVR, stopVR };
};

export default useVR;
