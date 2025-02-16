import React, { useContext } from "react";
import { SettingsContext } from "../context/SettingsProvider";

function MapSettings() {
  const { map, setMap } = useContext(SettingsContext);

  return (
    <div className="mb-3">
      <h3 className="fw-bold text-secondary">Configurações do Mapa:</h3>
      <select
        className="form-select"
        value={map}
        onChange={(e) => setMap(e.target.value)}
      >
        <option value="floresta">Floresta</option>
        <option value="sakura">Sakura</option>
      </select>
    </div>
  );
}

export default MapSettings;
