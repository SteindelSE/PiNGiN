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

import { spawn, ChildProcess } from 'child_process';
import {
  PinginSettings,
  CapturedContext,
  SessionInfo,
  ModelInfo,
  ThinkingLevel,
  IPC_CHANNELS,
} from '@shared/types';
import { BrowserWindow } from 'electron';

interface RpcResponse {
  type: string;
  id?: string;
  command?: string;
  success: boolean;
  data?: any;
  error?: string;
}

interface RpcEvent {
  type: string;
  [key: string]: any;
}

class RpcSession {
  private process: ChildProcess | null = null;
  private buffer = '';
  private requestCounter = 0;
  private pendingRequests = new Map<string, { resolve: (data: any) => void; reject: (err: any) => void }>();
  private eventCallbacks: ((event: RpcEvent) => void)[] = [];
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async start(
    agentDir: string,
    model?: string,
    thinkingLevel?: string
  ): Promise<void> {
    const args: string[] = [
      '--mode', 'rpc',
      '--no-session',
      '--session-dir', agentDir,
    ];

    if (model) {
      args.push('--model', model);
    }
    if (thinkingLevel) {
      args.push('--thinking', thinkingLevel);
    }

    this.process = spawn('pi', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process.stdout?.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString();
      this.processLines();
    });

    this.process.stderr?.on('data', (chunk: Buffer) => {
      const msg = chunk.toString().trim();
      if (msg) console.error('[pi-rpc]', msg);
    });

    this.process.on('exit', (code, signal) => {
      if (code !== null && code !== 0) {
        console.error(`[pi-rpc] Process exited with code ${code}`);
      } else if (signal) {
        console.error(`[pi-rpc] Process killed by signal ${signal}`);
      }
      // Reject all pending requests
      for (const [id, { reject }] of this.pendingRequests) {
        reject(new Error('RPC process exited'));
        this.pendingRequests.delete(id);
      }
    });

    // Wait for the RPC to be ready
    await this.sendCommand({ type: 'get_state' });
  }

  async sendCommand(cmd: Record<string, any>): Promise<any> {
    if (!this.process?.stdin) {
      throw new Error('RPC process not available');
    }

    const id = `req-${++this.requestCounter}`;
    const cmdWithId = { ...cmd, id };
    const line = JSON.stringify(cmdWithId) + '\n';

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process?.stdin?.write(line, (err) => {
        if (err) {
          this.pendingRequests.delete(id);
          reject(err);
        }
      });
    });
  }

  async prompt(message: string): Promise<void> {
    const result = await this.sendCommand({ type: 'prompt', message });

    if (!result.success) {
      throw new Error(`Prompt failed: ${result.error}`);
    }
  }

  async abort(): Promise<void> {
    try {
      await this.sendCommand({ type: 'abort' });
    } catch {
      // Ignore abort errors (process may already be exiting)
    }
  }

  async setModel(provider: string, modelId: string): Promise<void> {
    await this.sendCommand({ type: 'set_model', provider, modelId });
  }

  async setThinkingLevel(level: string): Promise<void> {
    await this.sendCommand({ type: 'set_thinking_level', level });
  }

  async getState(): Promise<any> {
    const result = await this.sendCommand({ type: 'get_state' });
    return result.data || null;
  }

  async getStats(): Promise<any> {
    const result = await this.sendCommand({ type: 'get_session_stats' });
    return result.data || null;
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    const result = await this.sendCommand({ type: 'get_available_models' });
    return (result.data?.models || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      contextWindow: m.contextWindow,
      reasoning: m.reasoning,
    }));
  }

  onEvent(callback: (event: RpcEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  dispose(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.pendingRequests.clear();
    this.eventCallbacks = [];
  }

  private processLines(): void {
    while (true) {
      const newlineIndex = this.buffer.indexOf('\n');
      if (newlineIndex === -1) break;

      let line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);

      try {
        const data = JSON.parse(line);

        // Check if it's a response to a pending request
        if (data.type === 'response' && data.id) {
          const pending = this.pendingRequests.get(data.id);
          if (pending) {
            this.pendingRequests.delete(data.id);
            if (data.success) {
              pending.resolve(data.data ?? null);
            } else {
              pending.reject(new Error(data.error || 'RPC command failed'));
            }
          }
        } else {
          // It's an event — forward to callbacks
          for (const cb of this.eventCallbacks) {
            try {
              cb(data);
            } catch {}
          }
        }
      } catch {
        // Ignore malformed lines
      }
    }
  }
}

export class SessionManager {
  private inlineRpc: RpcSession | null = null;
  private backgroundSessions: Map<string, RpcSession> = new Map();
  private sessionInfos: Map<string, SessionInfo> = new Map();
  private currentSessionId: string | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor(private agentDir: string) {}

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win;
  }

  async startSession(settings: PinginSettings, context?: CapturedContext): Promise<void> {
    // If we already have an inline session, just resume it
    if (this.inlineRpc) {
      this.currentSessionId = 'inline';
      this.updateSessionInfo('inline', settings);
      return;
    }

    try {
      const rpc = new RpcSession('inline');
      await rpc.start(
        this.agentDir,
        settings.model,
        settings.thinkingLevel
      );

      this.inlineRpc = rpc;
      this.currentSessionId = 'inline';

      // Subscribe to events and forward to renderer
      rpc.onEvent((event) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(IPC_CHANNELS.SESSION_EVENT, {
            sessionId: 'inline',
            event,
          });
        }
        this.updateSessionInfo('inline', settings, event);
      });

      this.updateSessionInfo('inline', settings);
    } catch (err) {
      console.error('Failed to start session:', err);
      throw err;
    }
  }

  async sendPrompt(message: string): Promise<void> {
    if (!this.inlineRpc) {
      throw new Error('No active session');
    }
    return this.inlineRpc.prompt(message);
  }

  async abort(): Promise<void> {
    if (this.inlineRpc) {
      await this.inlineRpc.abort();
    }
  }

  async setModel(modelId: string): Promise<void> {
    if (!this.inlineRpc) return;
    // modelId could be "provider/model" or just "model"
    // Look it up to get the right provider
    const models = await this.inlineRpc.getAvailableModels();
    const found = models.find((m) => m.id === modelId || m.name === modelId);
    if (found) {
      await this.inlineRpc.setModel(found.provider, modelId);
    } else {
      // Fallback: split on / and hope for the best
      const parts = modelId.split('/');
      if (parts.length >= 2) {
        await this.inlineRpc.setModel(parts[0], parts.slice(1).join('/'));
      }
    }
  }

  async setThinkingLevel(level: ThinkingLevel): Promise<void> {
    if (!this.inlineRpc) return;
    await this.inlineRpc.setThinkingLevel(level);
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    if (!this.inlineRpc) return [];
    try {
      return await this.inlineRpc.getAvailableModels();
    } catch {
      return [];
    }
  }

  async getStats(): Promise<any> {
    if (!this.inlineRpc) return null;
    try {
      const state = await this.inlineRpc.getState();
      const stats = await this.inlineRpc.getStats();

      return {
        model: state?.model ? {
          id: state.model.id,
          name: state.model.name,
          provider: state.model.provider,
          contextWindow: state.model.contextWindow,
        } : null,
        thinkingLevel: state?.thinkingLevel,
        isStreaming: state?.isStreaming,
        messageCount: state?.messageCount,
        contextUsage: stats?.contextUsage,
      };
    } catch {
      return null;
    }
  }

  getState(): SessionInfo | null {
    if (!this.currentSessionId) return null;
    return this.sessionInfos.get(this.currentSessionId) || null;
  }

  async spawnBackgroundSession(
    settings: PinginSettings,
    context?: CapturedContext
  ): Promise<string> {
    const sessionId = `bg-${Date.now()}`;

    try {
      const rpc = new RpcSession(sessionId);
      await rpc.start(
        this.agentDir,
        settings.model,
        settings.thinkingLevel
      );

      this.backgroundSessions.set(sessionId, rpc);

      rpc.onEvent((event) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(IPC_CHANNELS.SESSION_EVENT, {
            sessionId,
            event,
          });
        }
        this.updateSessionInfo(sessionId, settings, event);
      });

      this.sessionInfos.set(sessionId, {
        id: sessionId,
        name: context?.windowTitle || 'Background Session',
        type: 'background',
        model: null,
        thinkingLevel: settings.thinkingLevel,
        isStreaming: false,
        messageCount: 0,
        contextUsage: null,
        lastActivity: Date.now(),
      });

      return sessionId;
    } catch (err) {
      console.error('Failed to spawn background session:', err);
      throw err;
    }
  }

  async resumeSession(sessionId: string): Promise<void> {
    const rpc = this.backgroundSessions.get(sessionId);
    if (!rpc) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Switch inline session to this background session
    this.inlineRpc = rpc;
    this.currentSessionId = sessionId;

    // Notify renderer
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(IPC_CHANNELS.SESSION_STATE, this.getState());
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const rpc = this.backgroundSessions.get(sessionId);
    if (rpc) {
      rpc.dispose();
      this.backgroundSessions.delete(sessionId);
    }
    this.sessionInfos.delete(sessionId);
  }

  getAllSessions(): SessionInfo[] {
    const sessions: SessionInfo[] = [];

    if (this.sessionInfos.has('inline')) {
      sessions.push(this.sessionInfos.get('inline')!);
    }

    for (const [id, info] of this.sessionInfos) {
      if (id !== 'inline') {
        sessions.push(info);
      }
    }

    sessions.sort((a, b) => b.lastActivity - a.lastActivity);
    return sessions;
  }

  private updateSessionInfo(
    sessionId: string,
    settings: PinginSettings,
    event?: RpcEvent
  ): void {
    const info = this.sessionInfos.get(sessionId);
    if (!info) return;

    info.lastActivity = Date.now();

    if (event) {
      if (event.type === 'agent_start' || event.type === 'message_update') {
        info.isStreaming = true;
      } else if (event.type === 'agent_end') {
        info.isStreaming = false;
      } else if (event.type === 'message_end') {
        info.messageCount++;
      }
    }

    this.sessionInfos.set(sessionId, info);
  }

  dispose(): void {
    if (this.inlineRpc) {
      this.inlineRpc.dispose();
      this.inlineRpc = null;
    }

    for (const [id, rpc] of this.backgroundSessions) {
      rpc.dispose();
    }
    this.backgroundSessions.clear();
    this.sessionInfos.clear();
    this.currentSessionId = null;
  }
}
