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

import React, { useEffect, useCallback, useRef } from 'react';
import { usePinginStore } from './store';
import ChatWindow from './components/ChatWindow';
import SessionHistory from './components/SessionHistory';
import ContextPill from './components/ContextPill';
import HamburgerMenu from './components/HamburgerMenu';
import { PinginSettings, DEFAULT_SETTINGS, IPC_CHANNELS } from '@shared/types';

// Declare the pingin API from preload
declare global {
  interface Window {
    pingin: {
      channels: typeof IPC_CHANNELS;
      onContextReady: (cb: (ctx: any) => void) => void;
      onSessionEvent: (cb: (data: { sessionId: string; event: any }) => void) => void;
      sendPrompt: (message: string) => Promise<void>;
      abortSession: () => Promise<void>;
      getSessionState: () => Promise<any>;
      getSessionStats: () => Promise<any>;
      setModel: (modelId: string) => Promise<void>;
      setThinkingLevel: (level: string) => Promise<void>;
      getAvailableModels: () => Promise<any[]>;
      getSettings: () => Promise<PinginSettings>;
      setSettings: (settings: PinginSettings) => Promise<any>;
      hideWindow: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      captureContext: () => Promise<any>;
      onMarkRegionStart: (cb: () => void) => void;
      endMarkRegion: () => Promise<any>;
      resumeSession: (sessionId: string) => Promise<any>;
      deleteSession: (sessionId: string) => Promise<any>;
      getAllSessions: () => Promise<any[]>;
      saveSession: () => Promise<any>;
    };
  }
}

const App: React.FC = () => {
  const {
    theme, setTheme, settings, setSettings,
    setContext, addMessage, addSection, clearMessages, clearSections,
    setIsStreaming, setSessionInfo, setModels, setContextUsage,
    setInputText, isMarking, setIsMarking, setSessions,
  } = usePinginStore();

  const sessionsLoadedRef = useRef(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load settings and models on mount
  useEffect(() => {
    const init = async () => {
      try {
        const s = await window.pingin.getSettings();
        setSettings(s);
        setTheme(s.theme);

        const models = await window.pingin.getAvailableModels();
        setModels(models);

        const sessions = await window.pingin.getAllSessions();
        setSessions(sessions);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setSettings(DEFAULT_SETTINGS);
      }
    };
    init();
  }, [setSettings, setTheme, setModels]);

  // Listen for context ready
  useEffect(() => {
    window.pingin.onContextReady((ctx) => {
      setContext(ctx);
      setInputText('');
    });
  }, [setContext, setInputText]);

  // Listen for session events
  const handleSessionEvent = useCallback((data: { sessionId: string; event: any }) => {
    const { event } = data;

    switch (event.type) {
      case 'agent_start':
        setIsStreaming(true);
        break;

      case 'agent_end':
        setIsStreaming(false);
        break;

      case 'message_update': {
        const assistantEvent = event.assistantMessageEvent;
        if (!assistantEvent) break;

        const deltaType = assistantEvent.type;

        if (deltaType === 'text_start') {
          // New text block — add a new assistant message
          addMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          });
        } else if (deltaType === 'text_delta') {
          // Append text to the last assistant message
          const store = usePinginStore.getState();
          const updatedMessages = [...store.messages];
          const lastIdx = updatedMessages.length - 1;
          if (lastIdx >= 0 && updatedMessages[lastIdx].role === 'assistant') {
            updatedMessages[lastIdx] = {
              ...updatedMessages[lastIdx],
              content: updatedMessages[lastIdx].content + assistantEvent.delta,
            };
            usePinginStore.setState({ messages: updatedMessages });
          }
        } else if (deltaType === 'thinking_start') {
          addSection({
            id: `section-${Date.now()}`,
            type: 'thinking',
            label: 'Thinking...',
            content: '',
            collapsed: true,
            timestamp: Date.now(),
          });
        } else if (deltaType === 'thinking_delta') {
          const store = usePinginStore.getState();
          const sections = [...store.sections];
          const lastSection = sections.find(
            (s) => s.type === 'thinking' && s.collapsed
          );
          if (lastSection) {
            lastSection.content += assistantEvent.delta;
            usePinginStore.setState({ sections });
          }
        } else if (deltaType === 'toolcall_start') {
          const partial = assistantEvent.partial;
          const toolName = partial?.toolCall?.name || 'unknown';
          addSection({
            id: `section-${Date.now()}`,
            type: 'toolcall',
            label: `Calling tool ${toolName}...`,
            content: '',
            collapsed: false,
            timestamp: Date.now(),
          });
        } else if (deltaType === 'toolcall_end') {
          const partial = assistantEvent.partial;
          const toolName = partial?.toolCall?.name || 'unknown';
          addSection({
            id: `section-${Date.now()}`,
            type: 'toolresult',
            label: `Tool result: ${toolName}`,
            content: '',
            collapsed: true,
            timestamp: Date.now(),
          });
        }
        break;
      }

      case 'tool_execution_start':
        addSection({
          id: `section-${Date.now()}`,
          type: 'toolcall',
          label: `Calling tool ${event.toolName}...`,
          content: event.args ? JSON.stringify(event.args, null, 2) : '',
          collapsed: false,
          timestamp: Date.now(),
        });
        break;

      case 'tool_execution_end':
        const resultContent = event.result?.content?.[0]?.text || '';
        addSection({
          id: `section-${Date.now()}`,
          type: 'toolresult',
          label: `Tool result: ${event.toolName}`,
          content: resultContent,
          collapsed: true,
          timestamp: Date.now(),
        });
        break;

      case 'compaction_start':
        addSection({
          id: `section-${Date.now()}`,
          type: 'compaction',
          label: 'Compacting...',
          content: event.reason ? `Reason: ${event.reason}` : '',
          collapsed: true,
          timestamp: Date.now(),
        });
        break;

      case 'auto_retry_start':
        addSection({
          id: `section-${Date.now()}`,
          type: 'retry',
          label: `Retrying... (attempt ${event.attempt}/${event.maxAttempts})`,
          content: event.errorMessage || '',
          collapsed: true,
          timestamp: Date.now(),
        });
        break;

      case 'message_start':
        if (event.message?.role === 'user') {
          const content = typeof event.message.content === 'string'
            ? event.message.content
            : event.message.content?.[0]?.text || JSON.stringify(event.message.content);
          addMessage({
            id: `msg-${Date.now()}`,
            role: 'user',
            content,
            timestamp: Date.now(),
          });
        }
        break;

      case 'message_end':
        if (event.message?.role === 'assistant') {
          // Finalize — nothing special needed
        }
        break;
    }

    // Update context usage from session stats periodically
    if (event.type === 'agent_end' || event.type === 'message_end') {
      updateContextUsage();
    }
  }, [addMessage, addSection, setIsStreaming]);

  useEffect(() => {
    window.pingin.onSessionEvent(handleSessionEvent);
  }, [handleSessionEvent]);

  // Update context usage
  const updateContextUsage = useCallback(async () => {
    try {
      const stats = await window.pingin.getSessionStats();
      if (stats?.contextUsage) {
        setContextUsage(stats.contextUsage);
      }
      if (stats) {
        setSessionInfo({
          id: 'inline',
          name: 'Inline Session',
          type: 'cursor',
          model: stats.model,
          thinkingLevel: stats.thinkingLevel,
          isStreaming: stats.isStreaming,
          messageCount: stats.messageCount,
          contextUsage: stats.contextUsage || null,
          lastActivity: Date.now(),
        });
      }
    } catch {}
  }, [setContextUsage, setSessionInfo]);

  // Mark region handler
  useEffect(() => {
    window.pingin.onMarkRegionStart(() => {
      setIsMarking(true);
    });
  }, [setIsMarking]);

  // Keyboard shortcuts in renderer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const s = usePinginStore.getState().settings;
        if (s?.closeOnEscape) {
          window.pingin.hideWindow();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="h-full w-full flex flex-col glass rounded-2xl overflow-hidden">
      <ChatWindow />
      <ContextPill />
      <SessionHistory />
      <HamburgerMenu />
    </div>
  );
};

export default App;
