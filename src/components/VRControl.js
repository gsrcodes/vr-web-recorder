import React from "react";
import useVR from "../hooks/useVR";

function VrControl() {
  const { isVRRunning, startVR, stopVR } = useVR();

  return (
    <div className="d-flex justify-content-center gap-3">
      <button className="btn btn-success btn-lg" onClick={startVR} disabled={isVRRunning}>
        🎮 Iniciar VR
      </button>
      <button className="btn btn-danger btn-lg" onClick={stopVR} disabled={!isVRRunning}>
        ⛔ Parar VR
      </button>
    </div>
  );
}

export default VrControl;
