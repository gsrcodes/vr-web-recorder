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
  const vrWindowRef = useRef(null); // Referência para a aba do WebGL

  const maps = [
    { name: "Floresta", value: "floresta" },
    { name: "Sakura", value: "sakura" },
    { name: "Deserto", value: "deserto" }
  ];

  // Iniciar VR com gravação de tela
  function startVR() {
    if (!selectedMap) {
      alert("Escolha um mapa antes de iniciar!");
      return;
    }

    const webglPath = `${window.location.origin}/vr-web-recorder/webgl/index.html?map=${selectedMap}`;
    const vrWin = window.open(webglPath, "_blank");
    vrWindowRef.current = vrWin; // Salva a referência da aba

    console.log("VR Iniciado no mapa:", selectedMap);
    setIsVRRunning(true);

    // Espera a aba abrir para iniciar gravação
    setTimeout(() => startRecording(), 2000);
  }

  // Iniciar gravação de tela
  const startRecording = async () => {
    try {
      console.log("Solicitando permissão para gravação...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
      });

      console.log("Permissão concedida! Iniciando gravação...");
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
      console.log("Gravação iniciada!");
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
    }
  };

  // Parar VR e salvar vídeo + texto
  const stopVR = async () => {
    setIsVRRunning(false);

    // Parar a gravação
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

    // Parar compartilhamento de tela
    if (videoRef.current && videoRef.current.srcObject) {
      let tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // Fechar a aba do WebGL
    if (vrWindowRef.current && !vrWindowRef.current.closed) {
      vrWindowRef.current.close();
    }

    // Salvar o texto digitado
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

      <button onClick={startVR} disabled={isVRRunning}>
        Iniciar VR
      </button>

      <button onClick={stopVR} disabled={!isVRRunning} style={{ marginLeft: "10px" }}>
        Parar VR
      </button>

      <br /><br />

      {/* Campo de texto aparece apenas quando o VR está ativo */}
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
