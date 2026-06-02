# ⚡ PiNGiN

A cross-platform local-first **pi-agent companion** that appears next to your cursor on shortcut, captures context automatically, provides inline chat for simple tasks, and manages background pi sessions for heavier tasks.

## Features

- **Cursor-following window** — appears at your cursor position on global shortcut
- **Automatic context capture** — window title, selected text, browser URL, screenshot
- **Inline chat** — send prompts and receive streaming responses with thinking/tool-call sections
- **Background sessions** — spawn and manage multiple pi-agent sessions
- **Session history** — slide-out panel with cursor (purple) and background (grey) sessions
- **Context pill** — bottom bar showing model, thinking level, and context usage with color-coded progress bar
- **Themeable** — slate-red, slate-blue, slate-green, slate-purple
- **Mark region** — mark a screen region for focused context capture

## Architecture

PiNGiN uses **Electron** for the desktop shell and communicates with pi-agent via **RPC mode** (`pi --mode rpc`). This gives us:

- Full Node.js compatibility (no `node:sqlite` or WebIDL issues in Electron)
- Process isolation — the pi-agent runs in its own process
- Clean streaming event pipeline from agent to renderer

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **pi-agent** installed and working (`pi --version` should succeed)
- Your pi-agent configured with API keys/models

### Platform-specific dependencies

**Linux:**
- `xdotool` — for window title and selected text capture
- `wmctrl` — fallback window title capture

**macOS:**
- No extra dependencies (uses `osascript`)

**Windows:**
- PowerShell — for window title capture (built-in)

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd pingin

# Install dependencies
npm install

# Build
npm run build

# Run
npm start
```

### Development

```bash
# Dev mode (hot reload)
npm run dev

# Type checking
npm run typecheck
```

### Packaging

```bash
# Build for your platform
npm run package

# Build for all platforms (requires proper build env)
npm run package:all
```

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` (default) | Capture context and open PiNGiN |
| `Ctrl+Shift+M` (default) | Mark a screen region for focused capture |
| `Escape` | Hide PiNGiN window |
| `Enter` | Send message |
| `Shift+Enter` | New line in input |

### Workflow

1. **Press the shortcut** — PiNGiN captures your current context (window title, selected text, browser URL, screenshot) and opens at your cursor
2. **Context is sent automatically** as the initial prompt — no manual copy-paste needed
3. **Chat inline** — type follow-up messages and receive streaming responses
4. **Manage sessions** — use the hamburger menu to switch models, thinking levels, or themes
5. **Session history** — click the clock icon to see and resume past sessions

## Configuration

Settings are stored in `~/.config/PiNGiN/settings.json` (Linux), `%APPDATA%/PiNGiN/settings.json` (Windows), or `~/Library/Application Support/PiNGiN/settings.json` (macOS).

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `shortcut` | string | `CmdOrCtrl+Shift+P` | Global shortcut to open PiNGiN |
| `markShortcut` | string | `CmdOrCtrl+Shift+M` | Global shortcut to mark region |
| `model` | string | `Jackrong/Qwopus3.6-27B-v2-MTP-GGUF` | Default model ID |
| `thinkingLevel` | string | `high` | Default thinking level |
| `theme` | string | `slate-red` | Color theme |
| `contextWarningPercent` | number | `60` | Progress bar turns yellow at this % |
| `contextDangerPercent` | number | `80` | Progress bar turns red at this % |
| `alwaysOnTop` | boolean | `true` | Keep window above others |
| `closeOnEscape` | boolean | `true` | Hide window on Escape |
| `windowWidth` | number | `420` | Window width in pixels |
| `windowHeight` | number | `600` | Window height in pixels |
| `captureScreenshot` | boolean | `true` | Capture screenshot on shortcut |
| `captureSelectedText` | boolean | `true` | Capture selected text |
| `captureBrowserUrl` | boolean | `true` | Capture browser URL |
| `captureWindow` | boolean | `true` | Capture window title |
| `agentDir` | string | `~/.pi/agent` | pi-agent directory |
| `maxInlineTokens` | number | `4000` | Max tokens for inline sessions |
| `autoPushToSession` | string | `on-tool-calls` | When to push to session file |

## Docker

```bash
# Build
docker build -t pingin .

# Run (requires X11 forwarding or Wayland)
docker run -it --rm \
  -v ~/.pi/agent:/root/.pi/agent \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  pingin
```

## Project Structure

```
pingin/
├── src/
│   ├── main/                # Electron main process
│   │   ├── index.ts         # Entry point
│   │   ├── window-manager.ts # Window creation/management
│   │   ├── shortcut-manager.ts # Global shortcuts
│   │   ├── context-capture.ts # Screen/window capture
│   │   └── session-manager.ts # RPC session management
│   ├── preload/             # IPC bridge
│   │   └── index.ts
│   ├── renderer/            # React UI
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── store.ts         # Zustand store
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── ContextPill.tsx
│   │   │   ├── FoldableSection.tsx
│   │   │   ├── HamburgerMenu.tsx
│   │   │   └── SessionHistory.tsx
│   │   └── styles/
│   │       └── globals.css
│   └── shared/
│       └── types.ts         # Shared types and IPC channels
├── docs/                    # Documentation
├── plans/                   # Design plans
├── docker/                  # Docker configuration
└── electron-builder.yml     # Packaging config
```

## Roadmap

- [x] Core UI with chat, context pill, session history
- [x] RPC-mode pi-agent integration
- [x] Context capture and auto-prompt
- [x] Model/thinking level/theme selectors
- [x] Session history with delete
- [ ] Tray icon for persistent background mode
- [ ] Session file persistence
- [ ] Multi-model routing
- [ ] Markdown rendering in chat
- [ ] Image input support
- [ ] System tray integration

## License

MIT — see [LICENSE](LICENSE) for details.
