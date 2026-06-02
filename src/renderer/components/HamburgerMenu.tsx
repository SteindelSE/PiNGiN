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

import React, { useState } from 'react';
import { usePinginStore } from '../store';
import { ThinkingLevel } from '@shared/types';

const HamburgerMenu: React.FC = () => {
  const {
    showHamburgerMenu, setShowHamburgerMenu,
    setTheme, theme,
    setShowModelSelector, setShowThinkingSelector, setShowSessionHistory,
    settings,
  } = usePinginStore();

  const [showSubmenu, setShowSubmenu] = useState<string | null>(null);

  const themes = [
    { id: 'slate-red', label: 'Slate Red', color: '#ef4444' },
    { id: 'slate-blue', label: 'Slate Blue', color: '#3b82f6' },
    { id: 'slate-green', label: 'Slate Green', color: '#22c55e' },
    { id: 'slate-purple', label: 'Slate Purple', color: '#a855f7' },
  ];

  const thinkingLevels: ThinkingLevel[] = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'];

  const handleSelectTheme = (themeId: string) => {
    setTheme(themeId);
    setShowSubmenu(null);
    if (settings) {
      window.pingin.setSettings({ ...settings, theme: themeId });
    }
  };

  const handleSelectThinking = (level: ThinkingLevel) => {
    window.pingin.setThinkingLevel(level);
    setShowSubmenu(null);
    if (settings) {
      window.pingin.setSettings({ ...settings, thinkingLevel: level });
    }
  };

  if (!showHamburgerMenu) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => {
          setShowHamburgerMenu(false);
          setShowSubmenu(null);
        }}
      />

      {/* Menu panel */}
      <div className="fixed bottom-12 left-2 right-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl z-50 animate-fade-in overflow-hidden">
        <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
          {/* Model selector */}
          <button
            onClick={() => {
              setShowSubmenu(showSubmenu === 'model' ? null : 'model');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/80 transition-colors no-drag text-left"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            <span className="text-sm text-slate-200">Model</span>
            <svg className="w-3 h-3 text-slate-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Thinking level */}
          <button
            onClick={() => {
              setShowSubmenu(showSubmenu === 'thinking' ? null : 'thinking');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/80 transition-colors no-drag text-left"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm text-slate-200">Thinking Level</span>
            <span className="text-xs text-slate-500 ml-auto capitalize">
              {settings?.thinkingLevel || 'high'}
            </span>
            <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Theme */}
          <button
            onClick={() => {
              setShowSubmenu(showSubmenu === 'theme' ? null : 'theme');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/80 transition-colors no-drag text-left"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span className="text-sm text-slate-200">Theme</span>
            <span className="text-xs text-slate-500 ml-auto capitalize">
              {theme?.replace('-', ' ') || 'slate red'}
            </span>
            <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Session History */}
          <button
            onClick={() => {
              setShowSessionHistory(true);
              setShowHamburgerMenu(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/80 transition-colors no-drag text-left"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-slate-200">Session History</span>
          </button>

          {/* Divider */}
          <div className="border-t border-slate-700/50 my-1" />

          {/* Close */}
          <button
            onClick={() => {
              setShowHamburgerMenu(false);
              setShowSubmenu(null);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/80 transition-colors no-drag text-left"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm text-slate-200">Close</span>
          </button>
        </div>

        {/* Submenu: Theme */}
        {showSubmenu === 'theme' && (
          <div className="border-t border-slate-700/50 p-3 space-y-1 animate-fade-in">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTheme(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors no-drag text-left ${
                  theme === t.id ? 'bg-slate-700/50' : 'hover:bg-slate-800/80'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-slate-600"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-sm text-slate-200">{t.label}</span>
                {theme === t.id && (
                  <svg className="w-4 h-4 text-accent ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Submenu: Thinking Level */}
        {showSubmenu === 'thinking' && (
          <div className="border-t border-slate-700/50 p-3 space-y-1 animate-fade-in">
            {thinkingLevels.map((level) => (
              <button
                key={level}
                onClick={() => handleSelectThinking(level)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors no-drag text-left ${
                  settings?.thinkingLevel === level ? 'bg-slate-700/50' : 'hover:bg-slate-800/80'
                }`}
              >
                <span className="text-sm text-slate-200 capitalize">{level}</span>
                {settings?.thinkingLevel === level && (
                  <svg className="w-4 h-4 text-accent ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Submenu: Model Selector */}
        {showSubmenu === 'model' && (
          <div className="border-t border-slate-700/50 p-3 space-y-1 animate-fade-in">
            <ModelSelector onClose={() => setShowSubmenu(null)} />
          </div>
        )}
      </div>
    </>
  );
};

// Model selector component
const ModelSelector: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('');

  React.useEffect(() => {
    const loadModels = async () => {
      try {
        const available = await window.pingin.getAvailableModels();
        setModels(available);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load models:', err);
        setLoading(false);
      }
    };
    loadModels();
  }, []);

  const handleSelect = async (modelId: string) => {
    setSelectedModel(modelId);
    try {
      await window.pingin.setModel(modelId);
      onClose();
    } catch (err) {
      console.error('Failed to set model:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-400">No models available</p>
        <p className="text-xs text-slate-500 mt-1">Check your API keys</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {models.map((model) => (
        <button
          key={model.id}
          onClick={() => handleSelect(model.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors no-drag text-left ${
            selectedModel === model.id ? 'bg-slate-700/50' : 'hover:bg-slate-800/80'
          }`}
        >
          <span className="text-xs font-medium text-slate-300 truncate">{model.name}</span>
          <span className="text-xs text-slate-500 ml-auto shrink-0">{model.provider}</span>
        </button>
      ))}
    </div>
  );
};

export default HamburgerMenu;
