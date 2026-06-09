import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/styles.css";
import { checkForUpdates } from "./lib/updater";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Checa atualizações ao iniciar (somente no build de produção dentro do Tauri).
if (import.meta.env.PROD) {
  checkForUpdates().catch((err) => console.error("Falha ao checar updates:", err));
}
