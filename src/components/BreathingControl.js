import React, { useContext } from "react";
import { SettingsContext } from "../context/SettingsProvider";

function BreathingControl() {
  const { isBreathingEnabled, setIsBreathingEnabled } = useContext(SettingsContext);

  return (
    <div className="mb-3">
      <h3 className="fw-bold text-secondary">Configuração da Respiração Guiada:</h3>
      <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="breathing"
          checked={isBreathingEnabled}
          onChange={() => setIsBreathingEnabled(!isBreathingEnabled)}
        />
        <label className="form-check-label" htmlFor="breathing">
          Ativar Círculo de Respiração
        </label>
      </div>
    </div>
  );
}

export default BreathingControl;
