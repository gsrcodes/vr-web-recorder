import React, { useContext } from "react";
import { SettingsContext } from "../context/SettingsProvider";

function CorgiSettings() {
  const { corgiVisible, setCorgiVisible, corgiFollows, setCorgiFollows } = useContext(SettingsContext);

  return (
    <div className="mb-3">
      <h3 className="fw-bold text-secondary">Configurações do Corgi:</h3>
      <div className="form-check">
        <input type="checkbox" className="form-check-input" id="corgiVisible"
          checked={corgiVisible} onChange={() => setCorgiVisible(!corgiVisible)} />
        <label className="form-check-label" htmlFor="corgiVisible">Mostrar Corgi</label>
      </div>
      <div className="form-check">
        <input type="checkbox" className="form-check-input" id="corgiFollow"
          checked={corgiFollows} onChange={() => setCorgiFollows(!corgiFollows)}
          disabled={!corgiVisible} />
        <label className="form-check-label" htmlFor="corgiFollow">Corgi segue o jogador</label>
      </div>
    </div>
  );
}

export default CorgiSettings;
