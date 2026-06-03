import React, { useState, useEffect } from 'react';
import { usePinginStore } from '../store';
import { DEFAULT_SETTINGS } from '@shared/types';

const THEMES = [
  { id: 'slate-red', label: 'Slate Red' },
  { id: 'slate-blue', label: 'Slate Blue' },
  { id: 'slate-green', label: 'Slate Green' },
  { id: 'slate-purple', label: 'Slate Purple' },
];

const THINKING_LEVELS = [
  { id: 'off', label: 'Off' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'xhigh', label: 'XHigh' },
];

const HamburgerMenu: React.FC = () => {
  const {
    showHamburgerMenu, setShowHamburgerMenu,
    theme, setTheme, settings, setSettings,
    sessionInfo, setSessionInfo,
    models, setModels,
  } = usePinginStore();

  const [selectedModel, setSelectedModel] = useState<string>(settings?.model || '');
  const [selectedThinking, setSelectedThinking] = useState<string>(settings?.thinkingLevel || 'high');
  const [selectedTheme, setSelectedTheme] = useState<string>(theme || 'slate-red');
  const [showModelList, setShowModelList] = useState(false);
  const [showThinkingList, setShowThinkingList] = useState(false);
  const [showThemeList, setShowThemeList] = useState(false);

  // Load models on open
  useEffect(() => {
    if (showHamburgerMenu) {
      loadModels();
    }
  }, [showHamburgerMenu]);

  const loadModels = async () => {
    try {
      const available = await window.pingin.getAvailableModels();
      setModels(available);
      if (available.length > 0 && !selectedModel) {
        setSelectedModel(available[0].id);
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  };

  const handleModelSelect = async (modelId: string) => {
    try {
      await window.pingin.setModel(modelId);
      setSelectedModel(modelId);
      setShowModelList(false);
      // Update settings
      const updated = { ...DEFAULT_SETTINGS, ...settings, model: modelId };
      setSettings(updated);
      await window.pingin.setSettings(updated);
      // Refresh session info
      const state = await window.pingin.getSessionState();
      if (state) {
        setSessionInfo({
          id: 'inline',
          name: 'Inline Session',
          type: 'cursor',
          model: state.model,
          thinkingLevel: state.thinkingLevel,
          isStreaming: state.isStreaming,
          messageCount: state.messageCount,
          contextUsage: state.contextUsage || null,
          lastActivity: Date.now(),
        });
      }
    } catch (err) {
      console.error('Failed to set model:', err);
    }
  };

  const handleThinkingSelect = async (level: string) => {
    try {
      await window.pingin.setThinkingLevel(level);
      setSelectedThinking(level);
      setShowThinkingList(false);
      // Update settings
      const updated = { ...DEFAULT_SETTINGS, ...settings, thinkingLevel: level as any };
      setSettings(updated);
      await window.pingin.setSettings(updated);
      // Refresh session info
      const state = await window.pingin.getSessionState();
      if (state) {
        setSessionInfo({
          id: 'inline',
          name: 'Inline Session',
          type: 'cursor',
          model: state.model,
          thinkingLevel: state.thinkingLevel,
          isStreaming: state.isStreaming,
          messageCount: state.messageCount,
          contextUsage: state.contextUsage || null,
          lastActivity: Date.now(),
        });
      }
    } catch (err) {
      console.error('Failed to set thinking level:', err);
    }
  };

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    setTheme(themeId);
    setShowThemeList(false);
    // Update settings
    const updated = { ...DEFAULT_SETTINGS, ...settings, theme: themeId };
    setSettings(updated);
    window.pingin.setSettings(updated);
  };

  const handleHide = async () => {
    setShowHamburgerMenu(false);
    await window.pingin.hideWindow();
  };

  if (!showHamburgerMenu) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={() => setShowHamburgerMenu(false)}
      />

      {/* Menu panel */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-accent-subtle z-50 animate-slide-in-left overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent-subtle bg-header">
          <h3 className="text-sm font-semibold text-text-accent">Settings</h3>
          <button
            onClick={() => setShowHamburgerMenu(false)}
            className="p-1 rounded hover:bg-accent-subtle text-slate-400 hover:text-text-accent transition-colors no-drag"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Model selector */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-400 mb-1">Model</label>
            <button
              onClick={() => { setShowModelList(!showModelList); setShowThinkingList(false); setShowThemeList(false); }}
              className="w-full text-left px-3 py-2 bg-slate-800/60 border border-accent-subtle rounded-lg text-sm text-text-accent hover:bg-slate-700/60 transition-colors no-drag"
            >
              {selectedModel || 'Select model'}
            </button>
            {showModelList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-accent-subtle rounded-lg max-h-48 overflow-y-auto z-50 no-drag">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleModelSelect(m.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent-subtle transition-colors ${
                      m.id === selectedModel ? 'text-text-accent bg-accent-subtle' : 'text-slate-300'
                    }`}
                  >
                    {m.name || m.id}
                  </button>
                ))}
                {models.length === 0 && (
                  <div className="px-3 py-2 text-sm text-slate-500">No models available</div>
                )}
              </div>
            )}
          </div>

          {/* Thinking level selector */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-400 mb-1">Thinking Level</label>
            <button
              onClick={() => { setShowThinkingList(!showThinkingList); setShowModelList(false); setShowThemeList(false); }}
              className="w-full text-left px-3 py-2 bg-slate-800/60 border border-accent-subtle rounded-lg text-sm text-text-accent hover:bg-slate-700/60 transition-colors no-drag"
            >
              {THINKING_LEVELS.find(t => t.id === selectedThinking)?.label || 'High'}
            </button>
            {showThinkingList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-accent-subtle rounded-lg max-h-48 overflow-y-auto z-50 no-drag">
                {THINKING_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => handleThinkingSelect(level.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent-subtle transition-colors ${
                      level.id === selectedThinking ? 'text-text-accent bg-accent-subtle' : 'text-slate-300'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme selector */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-400 mb-1">Theme</label>
            <button
              onClick={() => { setShowThemeList(!showThemeList); setShowModelList(false); setShowThinkingList(false); }}
              className="w-full text-left px-3 py-2 bg-slate-800/60 border border-accent-subtle rounded-lg text-sm text-text-accent hover:bg-slate-700/60 transition-colors no-drag"
            >
              {THEMES.find(t => t.id === selectedTheme)?.label || 'Slate Red'}
            </button>
            {showThemeList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-accent-subtle rounded-lg max-h-48 overflow-y-auto z-50 no-drag">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent-subtle transition-colors ${
                      theme.id === selectedTheme ? 'text-text-accent bg-accent-subtle' : 'text-slate-300'
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700/50" />

          {/* Hide button */}
          <button
            onClick={handleHide}
            className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/60 transition-colors no-drag"
          >
            Hide Window
          </button>
        </div>
      </div>
    </>
  );
};

export default HamburgerMenu;
