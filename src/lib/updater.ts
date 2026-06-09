import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ask, message } from "@tauri-apps/plugin-dialog";

/**
 * Checa se há uma versão nova publicada no GitHub Releases, pergunta ao
 * usuário se quer instalar e, em caso afirmativo, baixa, instala e reinicia.
 *
 * Silenciosa quando não há atualização ou quando ocorre erro de rede
 * (não interrompe o uso do app). Só roda dentro do Tauri.
 */
export async function checkForUpdates(): Promise<void> {
  const update = await check();
  if (!update) return;

  const wantsToInstall = await ask(
    `A versão ${update.version} está disponível (você está na ${update.currentVersion}).\n\nDeseja atualizar agora?`,
    { title: "Atualização disponível", kind: "info" }
  );
  if (!wantsToInstall) return;

  await update.downloadAndInstall();
  await message("Atualização instalada. O app será reiniciado.", {
    title: "Pronto",
    kind: "info",
  });
  await relaunch();
}
