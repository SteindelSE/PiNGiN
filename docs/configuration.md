# Configuration

PiNGiN stores settings in the following locations:

- **Linux:** `~/.config/PiNGiN/settings.json`
- **macOS:** `~/Library/Application Support/PiNGiN/settings.json`
- **Windows:** `%APPDATA%/PiNGiN/settings.json`

You can edit settings via the hamburger menu in the app, or directly in the settings file.

## Settings Reference

### Hotkeys

| Setting | Default | Description |
|---------|---------|-------------|
| `shortcut` | `CmdOrCtrl+Shift+P` | Global shortcut to open PiNGiN |
| `markShortcut` | `CmdOrCtrl+Shift+M` | Global shortcut to mark a screen region |

### Model & Thinking

| Setting | Default | Description |
|---------|---------|-------------|
| `model` | `Jackrong/Qwopus3.6-27B-v2-MTP-GGUF` | Default model ID |
| `thinkingLevel` | `high` | Default thinking level (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`) |

### Appearance

| Setting | Default | Description |
|---------|---------|-------------|
| `theme` | `slate-red` | Color theme (`slate-red`, `slate-blue`, `slate-green`, `slate-purple`) |
| `contextWarningPercent` | `60` | Context usage progress bar turns yellow at this % |
| `contextDangerPercent` | `80` | Context usage progress bar turns red at this % |
| `windowWidth` | `420` | Companion window width in pixels |
| `windowHeight` | `600` | Companion window height in pixels |
| `alwaysOnTop` | `true` | Keep window above other windows |
| `closeOnEscape` | `true` | Hide window when pressing Escape |

### Context Capture

| Setting | Default | Description |
|---------|---------|-------------|
| `captureScreenshot` | `true` | Capture a screenshot when opening PiNGiN |
| `captureSelectedText` | `true` | Capture currently selected text |
| `captureBrowserUrl` | `true` | Capture the current browser URL |
| `captureWindow` | `true` | Capture the active window title |

### Session

| Setting | Default | Description |
|---------|---------|-------------|
| `agentDir` | `~/.pi/agent` | pi-agent working directory |
| `sessionDir` | `null` | Override session directory |
| `maxInlineTokens` | `4000` | Maximum tokens for inline sessions |
| `autoPushToSession` | `on-tool-calls` | When to push to session file (`never`, `always`, `on-tool-calls`) |
| `autoCollapseThinking` | `true` | Auto-collapse thinking sections |
| `autoCollapseToolResults` | `true` | Auto-collapse tool result sections |

## Example Configuration

```json
{
  "shortcut": "CmdOrCtrl+Shift+P",
  "markShortcut": "CmdOrCtrl+Shift+M",
  "model": "Jackrong/Qwopus3.6-27B-v2-MTP-GGUF",
  "thinkingLevel": "high",
  "theme": "slate-red",
  "contextWarningPercent": 60,
  "contextDangerPercent": 80,
  "alwaysOnTop": true,
  "closeOnEscape": true,
  "windowWidth": 420,
  "windowHeight": 600,
  "captureScreenshot": true,
  "captureSelectedText": true,
  "captureBrowserUrl": true,
  "captureWindow": true,
  "agentDir": "~/.pi/agent",
  "sessionDir": null,
  "maxInlineTokens": 4000,
  "autoPushToSession": "on-tool-calls",
  "autoCollapseThinking": true,
  "autoCollapseToolResults": true
}
```
