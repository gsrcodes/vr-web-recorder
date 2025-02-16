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
  const [isStreaming, setIsStreaming] = useState(false); // Estado para ativar a transmissão ao vivo
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const vrWindowRef = useRef(null);
  const liveStreamRef = useRef(null); // Referência para o vídeo de transmissão ao vivo
  const streamRef = useRef(null); // Mantém a referência do stream para controle
  const [isSaving, setIsSaving] = useState(false); // Novo estado para bloquear a UI
  const [isBreathingEnabled, setIsBreathingEnabled] = useState(true); // Estado do círculo
  const originalTab = useRef(window);
  
  // Estados para os sons
  const [birds, setBirdsSound] = useState(true);
  const [wind, setWindSound] = useState(true);
  const [music, setMusicSound] = useState(true);

  useEffect(() => {
    if (isVRRunning) {
      updateSettings();
    }
  }, [isBreathingEnabled, birds, wind, music]);

  useEffect(() => {
    const checkVRWindowClosed = setInterval(() => {
        if (vrWindowRef.current && vrWindowRef.current.closed) {
            console.log("🛑 Janela do Unity fechada pelo usuário!");
            handleVRWindowClose();
        }
    }, 1000); // Verifica a cada segundo

    return () => clearInterval(checkVRWindowClosed);
  }, []);

  const handleVRWindowClose = async () => {
    if (isRecording) {
        setIsSaving(true); // Bloqueia UI antes de parar a gravação
        await stopRecording(); // Aguarda a gravação ser finalizada antes de continuar
    }

    console.log("🔄 Atualizando estados após fechamento da janela VR...");
    setIsVRRunning(false);
    setShowNotes(false);

    if (userText.trim() !== "") {
        downloadTextFile(userText);
    }

    vrWindowRef.current = null; // Reseta a referência da janela VR
  };

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

    const webglPath = `${window.location.origin}/vr-web-recorder/webgl/index.html?map=${selectedMap}&birds=${birds}&wind=${wind}&music=${music}&breathing=${isBreathingEnabled}`;
    const vrWin = window.open(webglPath, "_blank");
    vrWindowRef.current = vrWin;

    console.log("🎮 VR Iniciado:", selectedMap);
    setIsVRRunning(true);

    // Agora inicia a transmissão ao vivo automaticamente
    setTimeout(startStreaming, 2000); // Pequeno delay para garantir que a aba já carregou
  }


  function updateSettings() {
    if (vrWindowRef.current) {
      const settings = { birds, wind, music, breathing: isBreathingEnabled };
      vrWindowRef.current.postMessage({ type: "updateSettings", ...settings }, "*");
      console.log("🔄 Enviando configurações para Unity:", settings);
    }
  }

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
                    a.download = `gravacao-vr-${Date.now()}.webm`;
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
    if (!isVRRunning) return;

    console.log("⛔ Encerrando VR...");
    setIsVRRunning(false);
    setShowNotes(false);

    // Finaliza e salva a gravação antes de fechar o VR
    await stopRecording();

    if (userText.trim() !== "") {
        downloadTextFile(userText);
    }

    if (vrWindowRef.current && !vrWindowRef.current.closed) {
        vrWindowRef.current.close();
    }

    vrWindowRef.current = null;
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

  const startRecording = async (stream) => {
    try {
        if (!stream) {
            console.error("❌ Nenhum stream disponível para gravação.");
            return;
        }

        recordedChunksRef.current = []; // Limpa gravação anterior

        mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: "video/webm",
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.start(1000); // Grava em partes de 1 segundo (permite salvar durante a transmissão)
        setIsRecording(true);
        console.log("🎥 Gravação iniciada!");
    } catch (err) {
        console.error("❌ Erro ao iniciar gravação:", err);
    }
  };


  const startStreaming = async () => {
    if (!vrWindowRef.current || vrWindowRef.current.closed) {
        console.error("❌ Erro: A aba do VR não está aberta.");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" }, // Captura a tela com o cursor para garantir o WebGL
            audio: false // Mantém sem áudio para evitar problemas de eco
        });

        if (liveStreamRef.current) {
            liveStreamRef.current.srcObject = stream;
            liveStreamRef.current.play();
        }

        streamRef.current = stream;
        setIsStreaming(true);
        console.log("🔴 Transmissão ao vivo iniciada!");

        // Inicia a gravação ao mesmo tempo que a transmissão
        startRecording(stream);
        
        // Se o usuário parar a transmissão diretamente, detectamos e desligamos o VR
        stream.getVideoTracks()[0].addEventListener("ended", () => {
            console.log("📴 Transmissão ao vivo encerrada pelo usuário.");
            stopStreaming();
        });

    } catch (error) {
        console.error("❌ Erro ao capturar a aba do WebGL:", error);
    }
  };

  const stopStreaming = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        setIsStreaming(false);
        console.log("🛑 Transmissão ao vivo parada.");
    }

    if (liveStreamRef.current) {
        liveStreamRef.current.srcObject = null; // Garante que o vídeo não fique congelado
    }
  };

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

        {/* Configuração da Respiração */}
        <div className="mb-3">
          <h3 className="fw-bold text-secondary">Configuração da Respiração Guiada:</h3>
          <div className="form-check">
            <input type="checkbox" className="form-check-input" id="breathing" checked={isBreathingEnabled} onChange={() => setIsBreathingEnabled(!isBreathingEnabled)} />
            <label className="form-check-label" htmlFor="breathing">Ativar Círculo de Respiração</label>
          </div>
        </div>

        {/* Botões */}
        <div className="d-flex justify-content-center gap-3">
          <button className="btn btn-success btn-lg" onClick={startVR} disabled={isVRRunning}>🎮 Iniciar VR</button>
          <button className="btn btn-danger btn-lg" onClick={stopVR} disabled={!isVRRunning}>⛔ Parar VR</button>
        </div>

        {/* Exibição da Transmissão Ao Vivo */}
        {isVRRunning && (
            <div className="mt-4 text-center">
                <h3 className="text-secondary">🔴 Transmissão ao Vivo</h3>
                <video ref={liveStreamRef} className="border rounded shadow-lg" style={{ width: "100%", maxWidth: "720px" }} autoPlay playsInline></video>

                {/* Anotações abaixo da transmissão */}
                <div className="mt-4">
                    <h3 className="text-secondary">📝 Anotações</h3>
                    <textarea className="form-control mt-3" rows="4" value={userText} onChange={(e) => setUserText(e.target.value)} placeholder="Digite suas anotações..."></textarea>
                </div>
            </div>
        )}


        {/* Adiciona o elemento de vídeo oculto */}
        <video ref={videoRef} style={{ display: "none" }} autoPlay playsInline />
      </div>
    </div>
  );
}

export default App;
