import React, { useRef, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
const ffmpeg = createFFmpeg({ log: true });


function App() {
  const [isVRRunning, setIsVRRunning] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Função para iniciar a VR e gravação
  function startVR() {
    const webglPath = window.location.origin + window.location.pathname + "webgl/index.html";
    window.open(webglPath, "_blank");
}


  // Inicia a gravação da tela
  const startRecording = async (vrWindow) => {
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

  // Converte WEBM para MP4 usando FFmpeg.js
  const convertToMp4 = async (blob) => {
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }

    // Carregar o arquivo WEBM no FFmpeg
    await ffmpeg.FS("writeFile", "video.webm", await fetchFile(blob));

    // Converter para MP4
    await ffmpeg.run("-i", "video.webm", "output.mp4");

    // Obter o vídeo convertido
    const mp4Data = ffmpeg.FS("readFile", "output.mp4");
    const mp4Blob = new Blob([mp4Data.buffer], { type: "video/mp4" });

    return URL.createObjectURL(mp4Blob);
};



  // Função para parar a VR e salvar o vídeo
  const stopVR = async () => {
    setIsVRRunning(false);

    // Parar a gravação
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.onstop = async () => {
            const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });

            // Converter para MP4
            const mp4Url = await convertToMp4(blob);

            // Criar link de download do MP4
            const a = document.createElement("a");
            a.href = mp4Url;
            a.download = "gravacao-vr.mp4";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(mp4Url);
        };
    }

    // Parar o compartilhamento de tela
    if (videoRef.current && videoRef.current.srcObject) {
        let tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());  // Interrompe todas as tracks de vídeo
        videoRef.current.srcObject = null;  // Remove a referência da stream
    }
};


  // Escuta mensagens da aba do Unity WebGL (pulo do jogador)
  window.addEventListener("message", (event) => {
    if (event.data === "jump") {
      console.log("Pulei!");
    }
  });

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Realidade Virtual Web</h1>
      <button onClick={startVR} disabled={isVRRunning}>
        Iniciar VR
      </button>
      <button onClick={stopVR} disabled={!isVRRunning} style={{ marginLeft: "10px" }}>
        Parar VR
      </button>
      <video ref={videoRef} style={{ display: "none" }} autoPlay />
    </div>
  );
}

export default App;
