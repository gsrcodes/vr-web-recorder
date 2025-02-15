import React, { useRef, useState, useEffect } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import "bootstrap/dist/css/bootstrap.min.css";

const ffmpeg = createFFmpeg({ log: true });

function App() {
  const [isVRRunning, setIsVRRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [selectedMap, setSelectedMap] = useState("sakura");
  const [userText, setUserText] = useState("");
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const vrWindowRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false); // Novo estado para bloquear a UI

  // Estados para os sons
  const [birds, setBirdsSound] = useState(true);
  const [wind, setWindSound] = useState(true);
  const [music, setMusicSound] = useState(true);

  useEffect(() => {
    if (isVRRunning) {
      updateSoundSettings();
    }
  }, [birds, wind, music]);

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

    const webglPath = `${window.location.origin}/vr-web-recorder/webgl/index.html?map=${selectedMap}&birds=${birds}&wind=${wind}&music=${music}`;
    const vrWin = window.open(webglPath, "_blank");
    vrWindowRef.current = vrWin;

    console.log("VR Iniciado no mapa:", selectedMap);
    console.log("Configuração de sons inicial:", { birds, wind, music });

    setIsVRRunning(true);
  }

  function updateSoundSettings() {
    if (vrWindowRef.current) {
      const soundSettings = { birds, wind, music };
      vrWindowRef.current.postMessage({ type: "updateSounds", ...soundSettings }, "*");
      console.log("🔊 Enviando configuração de sons para WebGL:", soundSettings);
    }
  }

  const startRecording = async () => {
    try {
        if (!videoRef.current) {
            console.error("Elemento de vídeo não encontrado.");
            return;
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: "screen" }, // Mantém a gravação de outra tela
        });

        videoRef.current.srcObject = stream;
        recordedChunksRef.current = []; // Limpa a gravação anterior

        mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: "video/webm",
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = async () => {
            if (recordedChunksRef.current.length > 0) {
                setIsSaving(true); // Bloqueia UI ao iniciar o salvamento

                const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = "gravacao-vr.webm";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);

                console.log("📁 Gravação finalizada e salva!");
            }

            // Parar o compartilhamento de tela corretamente
            stream.getTracks().forEach(track => track.stop());

            setIsSaving(false); // Libera UI após salvar
            setIsRecording(false);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        console.log("🎥 Gravação iniciada!");
    } catch (err) {
        console.error("Erro ao iniciar gravação:", err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        console.log("⏹ Parando gravação...");
        return new Promise((resolve) => {
            mediaRecorderRef.current.onstop = async () => {
                if (recordedChunksRef.current.length > 0) {
                    setIsSaving(true); // Bloqueia UI ao iniciar o salvamento

                    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "gravacao-vr.webm";
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);

                    console.log("📁 Gravação finalizada e salva!");
                }

                setIsSaving(false); // Libera UI após salvar
                setIsRecording(false);
                resolve();
            };
            mediaRecorderRef.current.stop();
        });
    }
  };


  const stopVR = async () => {
    if (isRecording) {
        setIsSaving(true); // Bloqueia UI antes de parar a gravação
        await stopRecording(); // Aguarda a gravação ser finalizada antes de continuar
    }

    setIsVRRunning(false);
    setShowNotes(false);

    if (userText.trim() !== "") {
        downloadTextFile(userText);
    }

    if (vrWindowRef.current && !vrWindowRef.current.closed) {
        vrWindowRef.current.close();
    }
  };


  const downloadTextFile = (text) => {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "anotacao.txt";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(a.href);
  };

  const BlockUI = () => (
    <div style={{
        position: "fixed",
        top: 0, left: 0, width: "100%", height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontSize: "24px",
        fontWeight: "bold"
    }}>
        Salvando gravação... Aguarde.
    </div>
  );

  {isSaving && <BlockUI />}
  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4">
        <h1 className="text-center text-primary mb-4">Realidade Virtual Web</h1>

        {/* Selecionar o mapa */}
        <div className="mb-3">
          <label htmlFor="mapSelect" className="form-label fw-bold">Escolha um mapa:</label>
          <select
            id="mapSelect"
            className="form-select"
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value)}
            disabled={isVRRunning}
          >
            {maps.map((map) => (
              <option key={map.value} value={map.value}>{map.name}</option>
            ))}
          </select>
        </div>

        {/* Configuração dos Sons */}
        <div className="mb-3">
          <h3 className="fw-bold text-secondary">Configurações de Som:</h3>
          <div className="form-check">
            <input type="checkbox" className="form-check-input" id="birdsSound" checked={birds} onChange={() => setBirdsSound(!birds)} />
            <label className="form-check-label" htmlFor="birdsSound">Som de Pássaros</label>
          </div>

          <div className="form-check">
            <input type="checkbox" className="form-check-input" id="windSound" checked={wind} onChange={() => setWindSound(!wind)} />
            <label className="form-check-label" htmlFor="windSound">Som de Vento</label>
          </div>

          <div className="form-check">
            <input type="checkbox" className="form-check-input" id="musicSound" checked={music} onChange={() => setMusicSound(!music)} />
            <label className="form-check-label" htmlFor="musicSound">Música de Fundo</label>
          </div>
        </div>

        {/* Botões */}
        <div className="d-flex justify-content-center gap-3">
          <button className="btn btn-success btn-lg" onClick={startVR} disabled={isVRRunning}>🎮 Iniciar VR</button>
          <button className="btn btn-danger btn-lg" onClick={stopVR} disabled={!isVRRunning}>⛔ Parar VR</button>
        </div>

        {/* Botão de Gravação */}
        <div className="mt-3 d-flex justify-content-center">
          <button className={`btn btn-lg ${isRecording ? "btn-danger" : "btn-warning"}`} onClick={isRecording ? stopRecording : startRecording} disabled={!isVRRunning}>
            {isRecording ? "⏹ Parar Gravação" : "🎥 Iniciar Gravação"}
          </button>
        </div>

        {/* Anotações */}
        {isVRRunning && (
          <div className="mt-4 text-center">
            {!showNotes ? (
              <button className="btn btn-info btn-lg" onClick={() => setShowNotes(true)}>📝 Abrir Anotações</button>
            ) : (
              <textarea className="form-control mt-3" rows="4" value={userText} onChange={(e) => setUserText(e.target.value)} placeholder="Digite suas anotações..." />
            )}
          </div>
        )}

        {/* Adiciona o elemento de vídeo oculto */}
        <video ref={videoRef} style={{ display: "none" }} autoPlay playsInline />
      </div>
    </div>
  );
}

export default App;
