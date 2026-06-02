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

// PiNGiN shared types between main and renderer processes

// IPC event names
export const IPC_CHANNELS = {
  // Context capture
  CAPTURE_CONTEXT: 'pingin:capture-context',
  CONTEXT_READY: 'pingin:context-ready',
  // Session management
  SESSION_START: 'pingin:session-start',
  SESSION_EVENT: 'pingin:session-event',
  SESSION_PROMPT: 'pingin:session-prompt',
  SESSION_ABORT: 'pingin:session-abort',
  SESSION_STATE: 'pingin:session-state',
  SESSION_STATS: 'pingin:session-stats',
  SESSION_SET_MODEL: 'pingin:session-set-model',
  SESSION_SET_THINKING: 'pingin:session-set-thinking',
  SESSION_GET_MODELS: 'pingin:session-get-models',
  SESSION_RESUME: 'pingin:session-resume',
  SESSION_DELETE: 'pingin:session-delete',
  SESSIONS_LIST: 'pingin:sessions-list',
  // Window
  WINDOW_SHOW: 'pingin:window-show',
  WINDOW_HIDE: 'pingin:window-hide',
  WINDOW_CLOSE: 'pingin:window-close',
  // Settings
  SETTINGS_GET: 'pingin:settings-get',
  SETTINGS_SET: 'pingin:settings-set',
  // Mark region
  MARK_REGION_START: 'pingin:mark-region-start',
  MARK_REGION_END: 'pingin:mark-region-end',
} as const;

// Captured context
export interface CapturedContext {
  windowTitle: string;
  selectedText: string;
  browserUrl: string;
  screenshot?: string; // base64 PNG
  markedRegion?: string; // base64 PNG
  workingDirectory: string;
  timestamp: number;
}

// Pi agent event types (subset we care about)
export type AgentEventType =
  | 'agent_start'
  | 'agent_end'
  | 'turn_start'
  | 'turn_end'
  | 'message_start'
  | 'message_update'
  | 'message_end'
  | 'tool_execution_start'
  | 'tool_execution_update'
  | 'tool_execution_end'
  | 'queue_update'
  | 'compaction_start'
  | 'compaction_end'
  | 'auto_retry_start'
  | 'auto_retry_end'
  | 'extension_error';

// Streaming delta types
export type DeltaType =
  | 'start'
  | 'text_start'
  | 'text_delta'
  | 'text_end'
  | 'thinking_start'
  | 'thinking_delta'
  | 'thinking_end'
  | 'toolcall_start'
  | 'toolcall_delta'
  | 'toolcall_end'
  | 'done'
  | 'error';

// Thinking levels
export type ThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

// Model info
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  reasoning: boolean;
}

// Session info
export interface SessionInfo {
  id: string;
  name: string;
  type: 'cursor' | 'background';
  model: ModelInfo | null;
  thinkingLevel: ThinkingLevel;
  isStreaming: boolean;
  messageCount: number;
  contextUsage: {
    tokens: number;
    contextWindow: number;
    percent: number;
  } | null;
  lastActivity: number;
  sessionFile?: string;
}

// Chat message for UI
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Foldable section
export interface FoldableSection {
  id: string;
  type: 'thinking' | 'toolcall' | 'toolresult' | 'error' | 'compaction' | 'retry';
  label: string;
  content: string;
  collapsed: boolean;
  timestamp: number;
}

// Settings
export interface PinginSettings {
  shortcut: string;
  markShortcut: string;
  model: string;
  thinkingLevel: ThinkingLevel;
  theme: string;
  contextWarningPercent: number;
  contextDangerPercent: number;
  autoCollapseThinking: boolean;
  autoCollapseToolResults: boolean;
  alwaysOnTop: boolean;
  closeOnEscape: boolean;
  windowWidth: number;
  windowHeight: number;
  captureScreenshot: boolean;
  captureSelectedText: boolean;
  captureBrowserUrl: boolean;
  captureWindow: boolean;
  agentDir: string;
  sessionDir: string | null;
  maxInlineTokens: number;
  autoPushToSession: 'never' | 'always' | 'on-tool-calls';
}

// Default settings
export const DEFAULT_SETTINGS: PinginSettings = {
  shortcut: 'CmdOrCtrl+Shift+P',
  markShortcut: 'CmdOrCtrl+Shift+M',
  model: 'Jackrong/Qwopus3.6-27B-v2-MTP-GGUF',
  thinkingLevel: 'high',
  theme: 'slate-red',
  contextWarningPercent: 60,
  contextDangerPercent: 80,
  autoCollapseThinking: true,
  autoCollapseToolResults: true,
  alwaysOnTop: true,
  closeOnEscape: true,
  windowWidth: 420,
  windowHeight: 600,
  captureScreenshot: true,
  captureSelectedText: true,
  captureBrowserUrl: true,
  captureWindow: true,
  agentDir: '~/.pi/agent',
  sessionDir: null,
  maxInlineTokens: 4000,
  autoPushToSession: 'on-tool-calls',
};
