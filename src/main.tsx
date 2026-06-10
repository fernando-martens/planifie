import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/styles.css";
import { isTauri } from "./db";
import { checkForUpdates } from "./lib/updater";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Checa atualizações ao iniciar (somente no build de produção dentro do Tauri).
// No preview de browser (e2e) o Tauri não existe, então pulamos para não
// disparar erro de `invoke` indefinido.
if (import.meta.env.PROD && isTauri()) {
  checkForUpdates().catch((err) => console.error("Falha ao checar updates:", err));
}
