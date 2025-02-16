import React, { useContext } from "react";
import { SettingsContext } from "../context/SettingsProvider";

function SoundSettings() {
  const { birds, setBirdsSound, wind, setWindSound, music, setMusicSound } = useContext(SettingsContext);

  return (
    <div className="mb-3">
      <h3 className="fw-bold text-secondary">Configurações de Som:</h3>

      <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="birdsSound"
          checked={birds}
          onChange={() => setBirdsSound(!birds)}
        />
        <label className="form-check-label" htmlFor="birdsSound">
          Som de Pássaros
        </label>
      </div>

      <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="windSound"
          checked={wind}
          onChange={() => setWindSound(!wind)}
        />
        <label className="form-check-label" htmlFor="windSound">
          Som de Vento
        </label>
      </div>

      <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="musicSound"
          checked={music}
          onChange={() => setMusicSound(!music)}
        />
        <label className="form-check-label" htmlFor="musicSound">
          Música de Fundo
        </label>
      </div>
    </div>
  );
}

export default SoundSettings;
