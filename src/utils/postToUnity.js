export function postToUnity(vrWindowRef, settings) {
    if (vrWindowRef.current) {
      vrWindowRef.current.postMessage({ type: "updateSettings", ...settings }, "*");
      console.log("🔄 Enviando configurações para Unity:", settings);
    }
  }
  