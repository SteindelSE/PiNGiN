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

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/types';

// Expose a safe API to the renderer
contextBridge.exposeInMainWorld('pingin', {
  // IPC channels reference
  channels: IPC_CHANNELS,

  // Context
  onContextReady: (callback: (context: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.CONTEXT_READY, (_event, context) => callback(context));
  },

  // Session events
  onSessionEvent: (callback: (data: { sessionId: string; event: any }) => void) => {
    ipcRenderer.on(IPC_CHANNELS.SESSION_EVENT, (_event, data) => callback(data));
  },

  // Session actions
  sendPrompt: (message: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_PROMPT, message),
  abortSession: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_ABORT),
  getSessionState: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_STATE),
  getSessionStats: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_STATS),
  setModel: (modelId: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_SET_MODEL, modelId),
  setThinkingLevel: (level: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_SET_THINKING, level),
  getAvailableModels: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET_MODELS),
  resumeSession: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_RESUME, sessionId),
  deleteSession: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_DELETE, sessionId),
  getAllSessions: () => ipcRenderer.invoke(IPC_CHANNELS.SESSIONS_LIST),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSettings: (settings: any) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),

  // Window
  hideWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_HIDE),
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),

  // Context capture
  captureContext: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_CONTEXT),

  // Mark region
  onMarkRegionStart: (callback: () => void) => {
    ipcRenderer.on(IPC_CHANNELS.MARK_REGION_START, () => callback());
  },
  endMarkRegion: () => ipcRenderer.invoke(IPC_CHANNELS.MARK_REGION_END),
});
