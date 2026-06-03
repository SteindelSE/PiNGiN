// Copyright (C) 2026 SteindelSE
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import { WindowManager } from './window-manager';
import { ShortcutManager } from './shortcut-manager';
import { ContextCapture } from './context-capture';
import { SessionManager } from './session-manager';
import { PinginSettings, DEFAULT_SETTINGS, IPC_CHANNELS } from '@shared/types';

// Disable GPU acceleration — safer for headless/dev environments and some Linux setups
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
// Only use no-sandbox when running as root (dev environments)
if (process.getuid?.() === 0) {
  app.commandLine.appendSwitch('no-sandbox');
}

let mainWindow: BrowserWindow | null = null;
let settings: PinginSettings = DEFAULT_SETTINGS;
let windowManager: WindowManager;
let shortcutManager: ShortcutManager;
let contextCapture: ContextCapture;
let sessionManager: SessionManager;

// Load settings from file
function loadSettings(): PinginSettings {
  const settingsPath = getSettingsPath();
  try {
    const fs = require('fs');
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch {
    // Use defaults
  }
  return DEFAULT_SETTINGS;
}

function getSettingsPath(): string {
  const configDir = app.getPath('userData');
  const fs = require('fs');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return path.join(configDir, 'settings.json');
}

function saveSettings(s: PinginSettings): void {
  const settingsPath = getSettingsPath();
  try {
    const fs = require('fs');
    fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

function expandPath(p: string): string {
  if (p.startsWith('~')) {
    return path.join(app.getPath('home'), p.slice(1));
  }
  return p;
}

// Build the initial context prompt from captured context
function buildContextPrompt(context: any): string {
  const parts: string[] = [];

  if (context.windowTitle) {
    parts.push(`**Active Window:** ${context.windowTitle}`);
  }
  if (context.selectedText) {
    parts.push(`**Selected Text:**\n\`\`\`\n${context.selectedText}\n\`\`\``);
  }
  if (context.browserUrl) {
    parts.push(`**Browser URL:** ${context.browserUrl}`);
  }
  if (context.workingDirectory) {
    parts.push(`**Working Directory:** ${context.workingDirectory}`);
  }

  const contextBlock = parts.join('\n\n');

  return [
    'Here is my current context. Please acknowledge it briefly and wait for my next prompt:',
    contextBlock,
  ].join('\n\n');
}

app.whenReady().then(() => {
  settings = loadSettings();

  // Initialize managers
  windowManager = new WindowManager();
  contextCapture = new ContextCapture(settings);
  sessionManager = new SessionManager(expandPath(settings.agentDir));
  shortcutManager = new ShortcutManager();

  // Create main floating window (hidden initially)
  mainWindow = windowManager.createCompanionWindow(settings);
  sessionManager.setMainWindow(mainWindow);

  // Register IPC handlers
  registerIpcHandlers();

  // Register global shortcut
  shortcutManager.register(settings.shortcut, () => {
    handleShortcut();
  });

  // Register mark region shortcut
  shortcutManager.register(settings.markShortcut, () => {
    handleMarkRegion();
  });

  console.log('[PiNGiN] Ready');
});

async function handleShortcut() {
  try {
    // Capture context
    const context = await contextCapture.capture(settings);

    // Create or show the companion window
    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = windowManager.createCompanionWindow(settings);
      sessionManager.setMainWindow(mainWindow);
    }

    // Position at cursor
    const cursorPos = getCursorScreenPosition();
    mainWindow.setPosition(cursorPos.x, cursorPos.y, false);

    // Show window
    mainWindow.show();
    mainWindow.focus();

    // Send context to renderer
    mainWindow.webContents.send(IPC_CHANNELS.CONTEXT_READY, context);

    // Start or resume session
    await sessionManager.startSession(settings, context);

    // If we have context, send it as the initial prompt
    const prompt = buildContextPrompt(context);
    if (prompt) {
      await sessionManager.sendPrompt(prompt);
    }
  } catch (err) {
    console.error('[PiNGiN] Shortcut handler error:', err);
  }
}

function handleMarkRegion() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.MARK_REGION_START);
  }
}

function getCursorScreenPosition(): { x: number; y: number } {
  const display = screen.getCursorScreenPoint();
  const primaryDisplay = screen.getPrimaryDisplay();
  const bounds = primaryDisplay.workArea;

  // Clamp to screen bounds with window size consideration
  const x = Math.min(display.x, bounds.x + bounds.width - settings.windowWidth);
  const y = Math.min(display.y, bounds.y + bounds.height - settings.windowHeight);

  return {
    x: Math.max(bounds.x, x),
    y: Math.max(bounds.y, y),
  };
}

function registerIpcHandlers(): void {
  const { ipcMain } = require('electron');

  // Settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => settings);
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event: any, newSettings: PinginSettings) => {
    settings = { ...settings, ...newSettings };
    saveSettings(settings);

    // Re-register shortcut if changed
    if (newSettings.shortcut && newSettings.shortcut !== settings.shortcut) {
      shortcutManager.unregister(settings.shortcut);
      shortcutManager.register(newSettings.shortcut, () => handleShortcut());
    }
    return { success: true };
  });

  // Session
  ipcMain.handle(IPC_CHANNELS.SESSION_PROMPT, async (_event: any, message: string) => {
    return sessionManager.sendPrompt(message);
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_ABORT, async () => {
    return sessionManager.abort();
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_STATE, () => {
    return sessionManager.getState();
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_STATS, async () => {
    return sessionManager.getStats();
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_SET_MODEL, async (_event: any, modelId: string) => {
    await sessionManager.setModel(modelId);
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_SET_THINKING, async (_event: any, level: string) => {
    await sessionManager.setThinkingLevel(level as any);
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET_MODELS, async () => {
    return sessionManager.getAvailableModels();
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_RESUME, async (_event: any, sessionId: string) => {
    await sessionManager.resumeSession(sessionId);
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, async (_event: any, sessionId: string) => {
    await sessionManager.deleteSession(sessionId);
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.SESSIONS_LIST, () => {
    return sessionManager.getAllSessions();
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_SAVE, async () => {
    return sessionManager.saveCurrentSession();
  });

  // Window
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return mainWindow?.isMaximized() || false;
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_HIDE, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  // Context capture
  ipcMain.handle(IPC_CHANNELS.CAPTURE_CONTEXT, async () => {
    return contextCapture.capture(settings);
  });

  // Mark region
  ipcMain.handle(IPC_CHANNELS.MARK_REGION_END, async () => {
    return contextCapture.captureMarkedRegion();
  });
}

// App lifecycle
app.on('window-all-closed', () => {
  // Keep app running in background (global shortcut still works)
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = windowManager.createCompanionWindow(settings);
    sessionManager.setMainWindow(mainWindow);
  }
});

app.on('before-quit', () => {
  // Unregister all shortcuts
  shortcutManager.unregisterAll();
  // Clean up sessions
  sessionManager.dispose();
});
