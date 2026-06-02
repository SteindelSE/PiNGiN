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

import { create } from 'zustand';
import {
  ChatMessage,
  FoldableSection,
  SessionInfo,
  ModelInfo,
  ThinkingLevel,
  PinginSettings,
  CapturedContext,
} from '@shared/types';

interface PinginStore {
  // Theme
  theme: string;
  setTheme: (theme: string) => void;

  // Settings
  settings: PinginSettings | null;
  setSettings: (settings: PinginSettings) => void;

  // Context
  context: CapturedContext | null;
  setContext: (context: CapturedContext) => void;

  // Chat messages
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;

  // Foldable sections
  sections: FoldableSection[];
  addSection: (section: FoldableSection) => void;
  toggleSection: (id: string) => void;
  clearSections: () => void;

  // Session
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;

  // Session info
  sessionInfo: SessionInfo | null;
  setSessionInfo: (info: SessionInfo) => void;

  // Available models
  models: ModelInfo[];
  setModels: (models: ModelInfo[]) => void;

  // Session history
  sessions: SessionInfo[];
  setSessions: (sessions: SessionInfo[]) => void;

  // UI state
  showSessionHistory: boolean;
  setShowSessionHistory: (show: boolean) => void;
  showHamburgerMenu: boolean;
  setShowHamburgerMenu: (show: boolean) => void;
  showModelSelector: boolean;
  setShowModelSelector: (show: boolean) => void;
  showThinkingSelector: boolean;
  setShowThinkingSelector: (show: boolean) => void;

  // Input
  inputText: string;
  setInputText: (text: string) => void;

  // Context usage
  contextUsage: { tokens: number; contextWindow: number; percent: number } | null;
  setContextUsage: (usage: { tokens: number; contextWindow: number; percent: number } | null) => void;

  // Mark region
  isMarking: boolean;
  setIsMarking: (marking: boolean) => void;
}

export const usePinginStore = create<PinginStore>((set) => ({
  // Theme
  theme: 'slate-red',
  setTheme: (theme) => set({ theme }),

  // Settings
  settings: null,
  setSettings: (settings) => set({ settings }),

  // Context
  context: null,
  setContext: (context) => set({ context }),

  // Chat messages
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),

  // Foldable sections
  sections: [],
  addSection: (section) => set((state) => ({ sections: [...state.sections, section] })),
  toggleSection: (id) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === id ? { ...s, collapsed: !s.collapsed } : s
      ),
    })),
  clearSections: () => set({ sections: [] }),

  // Session
  isStreaming: false,
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  // Session info
  sessionInfo: null,
  setSessionInfo: (info) => set({ sessionInfo: info }),

  // Available models
  models: [],
  setModels: (models) => set({ models }),

  // Session history
  sessions: [],
  setSessions: (sessions) => set({ sessions }),

  // UI state
  showSessionHistory: false,
  setShowSessionHistory: (show) => set({ showSessionHistory: show }),
  showHamburgerMenu: false,
  setShowHamburgerMenu: (show) => set({ showHamburgerMenu: show }),
  showModelSelector: false,
  setShowModelSelector: (show) => set({ showModelSelector: show }),
  showThinkingSelector: false,
  setShowThinkingSelector: (show) => set({ showThinkingSelector: show }),

  // Input
  inputText: '',
  setInputText: (text) => set({ inputText: text }),

  // Context usage
  contextUsage: null,
  setContextUsage: (usage) => set({ contextUsage: usage }),

  // Mark region
  isMarking: false,
  setIsMarking: (marking) => set({ isMarking: marking }),
}));
