import React, { useRef, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
const ffmpeg = createFFmpeg({ log: true });

function App() {
  const [isVRRunning, setIsVRRunning] = useState(false);
  const [selectedMap, setSelectedMap] = useState("floresta");
  const [userText, setUserText] = useState("");
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const vrWindowRef = useRef(null);

  // Estados para os sons
  const [birdsSound, setBirdsSound] = useState(true);
  const [windSound, setWindSound] = useState(false);
  const [musicSound, setMusicSound] = useState(false);

  // Opções de mapas
  const maps = [
    { name: "Floresta", value: "floresta" },
    { name: "Sakura", value: "sakura" }
  ];

  function startVR() {
    if (!selectedMap) {
      alert("Escolha um mapa antes de iniciar!");
      return;
    }

    const webglPath = `${window.location.origin}/vr-web-recorder/webgl/index.html?map=${selectedMap}`;
    const vrWin = window.open(webglPath, "_blank");
    vrWindowRef.current = vrWin;

    console.log("VR Iniciado no mapa:", selectedMap);

    setIsVRRunning(true);
    setTimeout(() => startRecording(), 2000);

    // Aguarda um tempo e envia a configuração inicial dos sons
    setTimeout(() => updateSoundSettings(), 4000);
  }

  // Atualiza os sons em tempo real no WebGL
  function updateSoundSettings() {
    if (vrWindowRef.current) {
      vrWindowRef.current.postMessage(
        {
          type: "updateSounds",
          birds: birdsSound,
          wind: windSound,
          music: musicSound,
        },
        "*"
      );
      console.log("Enviando configuração de sons para WebGL:", { birdsSound, windSound, musicSound });
    }
  }

  // Inicia a gravação da tela
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
      });

      videoRef.current.srcObject = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
    }
  };

  // Parar VR e salvar vídeo + texto
  const stopVR = async () => {
    setIsVRRunning(false);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const mp4Url = await convertToMp4(blob);

        const a = document.createElement("a");
        a.href = mp4Url;
        a.download = "gravacao-vr.mp4";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(mp4Url);
      };
    }

    if (videoRef.current && videoRef.current.srcObject) {
      let tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (vrWindowRef.current && !vrWindowRef.current.closed) {
      vrWindowRef.current.close();
    }

    downloadTextFile(userText);
  };

  // Salvar o texto como .txt
  const downloadTextFile = (text) => {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "anotacao.txt";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(a.href);
  };

  // Converter WEBM para MP4
  const convertToMp4 = async (blob) => {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    await ffmpeg.FS("writeFile", "video.webm", await fetchFile(blob));
    await ffmpeg.run("-i", "video.webm", "output.mp4");

    const mp4Data = ffmpeg.FS("readFile", "output.mp4");
    const mp4Blob = new Blob([mp4Data.buffer], { type: "video/mp4" });

    return URL.createObjectURL(mp4Blob);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Realidade Virtual Web</h1>

      {/* Selecionar o mapa */}
      <label htmlFor="mapSelect">Escolha um mapa:</label>
      <select
        id="mapSelect"
        value={selectedMap}
        onChange={(e) => setSelectedMap(e.target.value)}
        disabled={isVRRunning}
      >
        {maps.map((map) => (
          <option key={map.value} value={map.value}>{map.name}</option>
        ))}
      </select>

      <br /><br />

      {/* Configuração dos Sons */}
      <h3>Configurações de Som:</h3>
      <label>
        <input
          type="checkbox"
          checked={birdsSound}
          onChange={() => { setBirdsSound(!birdsSound); updateSoundSettings(); }}
          disabled={!isVRRunning}
        />
        Som de Pássaros
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={windSound}
          onChange={() => { setWindSound(!windSound); updateSoundSettings(); }}
          disabled={!isVRRunning}
        />
        Som de Vento
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={musicSound}
          onChange={() => { setMusicSound(!musicSound); updateSoundSettings(); }}
          disabled={!isVRRunning}
        />
        Música de Fundo
      </label>

      <br /><br />

      <button onClick={startVR} disabled={isVRRunning}>
        Iniciar VR
      </button>

      <button onClick={stopVR} disabled={!isVRRunning} style={{ marginLeft: "10px" }}>
        Parar VR
      </button>

      <br /><br />

      {isVRRunning && (
        <div>
          <h3>Anotações:</h3>
          <textarea
            rows="5"
            cols="50"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder="Digite suas anotações aqui..."
          />
        </div>
      )}

      <video ref={videoRef} style={{ display: "none" }} autoPlay />
    </div>
  );
}

export default App;