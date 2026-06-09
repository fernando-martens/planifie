<div align="center">

<img src="./public/planifie-banner.svg" alt="planifie — timeline-based productivity & journaling" width="100%" />

<br/>

**A local-first desktop planner where every task is a living timeline.** 🌿

[![version](https://img.shields.io/badge/version-0.1.0--alpha-3231bc?style=flat-square)](https://github.com/fernando-martens/planifie/releases)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-82a983?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-7e96b4?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-c2a158?style=flat-square)](./LICENSE)

</div>

---

planifie turns each task into a chronological feed of *blocks* — quick notes, focus timers, and rich-text documents — organized across color-coded workspaces. ✨

Everything lives on your machine in a local SQLite database; **nothing leaves your computer**. Export any task or document to Markdown or PDF whenever you need to share it.

## ✨ Features

- 🧵 **Timeline-based tasks** — Each task is a stream of timestamped blocks instead of a flat checklist.
- 🧱 **Three block types**
  - 📋 **Notes** — fast, plain-text jottings.
  - 🕐 **Timers** — focus/stopwatch sessions with presets, pause/resume, and a persistent action bar that follows you across tasks.
  - 📄 **Documents** — full rich-text editing powered by [BlockNote](https://www.blocknotejs.org/), openable in a fullscreen editor.
- 🗂️ **Workspaces & tags** — Group tasks into color-coded workspaces and tag them for quick filtering.
- 📤 **Export** — One task or a single document, out to **Markdown** or **PDF**.
- 🔒 **Local-first** — Data is stored in SQLite via the Tauri SQL plugin; runs entirely offline.
- 🌗 **Light & dark themes** — with a custom type system (Hanken Grotesk, Newsreader, JetBrains Mono).

## 🧰 Tech stack

| Layer       | Tools                                                      |
|-------------|-----------------------------------------------------------|
| 🖥️ Desktop  | [Tauri 2](https://tauri.app/) (Rust)                      |
| 🎨 UI       | React 18 + TypeScript + [Mantine 8](https://mantine.dev/) |
| ✍️ Editor   | [BlockNote](https://www.blocknotejs.org/)                 |
| 🐻 State    | [Zustand](https://github.com/pmndrs/zustand)             |
| 💾 Storage  | SQLite (`tauri-plugin-sql`)                               |
| ⚡ Build    | Vite 6                                                     |
| 📦 Export   | jsPDF + marked                                             |
| 🧪 E2E tests| Playwright                                                 |

> 💡 The app runs in two modes: inside the Tauri shell it persists to SQLite; in a plain browser (e.g. `npm run dev`) it falls back to an in-memory adapter, which is handy for development and E2E tests.

## 🚀 Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Rust toolchain](https://www.rust-lang.org/tools/install) + [Tauri 2 system prerequisites](https://tauri.app/start/prerequisites/)

### Install

```bash
npm install
```

### Develop

```bash
# 🌐 Web preview (in-memory storage), fast iteration
npm run dev

# 🖥️ Full desktop app (SQLite persistence)
npm run tauri:dev
```

### Build

```bash
npm run build        # type-check + Vite build
npm run tauri:build  # bundle the native desktop app
```

### Test

```bash
npm run test:e2e        # Playwright E2E
npm run test:e2e:ui     # interactive runner
npm run test:e2e:report # last HTML report
```

## 🗺️ Project structure

```
src/
  components/   UI: sidebar, timeline, blocks, modals, action bar
  stores/       Zustand stores (tasks, workspaces, tags, timer, presets, UI, theme)
  db/           Storage adapters (SQLite + in-memory) behind a common interface
  lib/          Helpers (time, colors, markdown, export, ids)
  types/        Shared domain types
src-tauri/      Rust/Tauri desktop shell
```

## 📄 License

[MIT](./LICENSE) — made with 💜 using Tauri + React.
