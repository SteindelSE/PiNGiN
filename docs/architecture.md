# Architecture

## Overview

PiNGiN is an Electron-based desktop application that provides a cursor-following companion window for interacting with the pi-agent via RPC.

## Core Components

### Main Process (`src/main/`)

The Electron main process handles:

1. **Window Management** — creates and positions the companion window at the cursor
2. **Global Shortcuts** — registers and handles the hotkey to open PiNGiN
3. **Context Capture** — captures window title, selected text, browser URL, and screenshots
4. **Session Management** — spawns and manages `pi --mode rpc` subprocesses

### Preload (`src/preload/`)

The preload script exposes a safe IPC API to the renderer via `contextBridge`, providing:

- `window.pingin.onContextReady(cb)` — receive captured context
- `window.pingin.onSessionEvent(cb)` — receive streaming agent events
- `window.pingin.sendPrompt(message)` — send a prompt
- `window.pingin.abortSession()` — abort current session
- `window.pingin.getSessionStats()` — get session statistics
- `window.pingin.getAvailableModels()` — list available models
- `window.pingin.setSettings(settings)` — update settings
- And more...

### Renderer (`src/renderer/`)

The React renderer provides the UI:

- **ChatWindow** — message display, input, streaming indicator
- **ContextPill** — bottom bar with model, thinking level, context usage
- **SessionHistory** — slide-out panel showing past sessions
- **HamburgerMenu** — model/thinking/theme selectors
- **FoldableSection** — thinking, tool calls, tool results

## RPC Architecture

PiNGiN communicates with pi-agent via **RPC mode**, not direct SDK integration:

```
┌─────────────┐     IPC      ┌─────────────┐     JSONL     ┌─────────────┐
│  Renderer   │ ◄──────────► │  Main Proc  │ ◄──────────► │  pi --mode  │
│  (React)    │              │  (Electron) │              │   rpc       │
└─────────────┘              └─────────────┘              └─────────────┘
```

### Why RPC?

The pi-agent SDK uses Node.js internals (`node:sqlite`, `webidl.markAsUncloneable`) that are incompatible with Electron's bundled Node.js. RPC mode gives us:

- **Full Node.js compatibility** — pi-agent runs in its own Node.js process
- **Process isolation** — if pi-agent crashes, PiNGiN survives
- **Clean streaming** — JSONL events flow naturally from agent to renderer
- **Smaller bundle** — main process is only ~18KB instead of ~5MB

### RPC Protocol

Commands are sent as JSON lines on stdin:

```json
{"type":"get_state","id":"req-1"}
{"type":"prompt","message":"Hello","id":"req-2"}
{"type":"set_model","provider":"unsloth-api","modelId":"Jackrong/Qwopus3.6-27B-v2-MTP-GGUF","id":"req-3"}
{"type":"abort","id":"req-4"}
```

Responses and events are received as JSON lines on stdout:

```json
{"type":"response","id":"req-1","success":true,"data":{...}}
{"type":"agent_start"}
{"type":"message_update","assistantMessageEvent":{"type":"text_delta","delta":"Hello!"}}
{"type":"agent_end"}
```

## Data Flow

### Shortcut Pressed

1. `ShortcutManager` fires callback
2. `ContextCapture.capture()` gathers context
3. `SessionManager.startSession()` spawns `pi --mode rpc`
4. Context is built into a prompt and sent via `sendPrompt()`
5. Renderer receives `CONTEXT_READY` event with context data
6. Agent events stream to renderer via `SESSION_EVENT`

### User Sends Message

1. User types in `ChatWindow`, presses Enter
2. `window.pingin.sendPrompt(text)` invoked via IPC
3. Main process forwards to `SessionManager.sendPrompt()`
4. RPC command sent to pi-agent
5. Agent events stream back to renderer

### Session Ends

1. Agent sends `agent_end` event
2. Renderer updates streaming state
3. Context usage is refreshed via `get_session_stats`
4. Session info updated in store
