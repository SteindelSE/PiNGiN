import React, { useRef, useEffect, useCallback } from 'react';
import { usePinginStore } from '../store';
import FoldableSection from './FoldableSection';

const ChatWindow: React.FC = () => {
  const {
    messages, sections, context, isStreaming, inputText, setInputText,
    addMessage, clearMessages, clearSections,
    setShowHamburgerMenu,
  } = usePinginStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sections]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    // Add user message
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });

    setInputText('');

    try {
      await window.pingin.sendPrompt(text);
    } catch (err) {
      console.error('Failed to send prompt:', err);
      addMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Error: Failed to send message.',
        timestamp: Date.now(),
      });
    }
  }, [inputText, addMessage, setInputText]);

  const handleAbort = useCallback(async () => {
    try {
      await window.pingin.abortSession();
    } catch (err) {
      console.error('Failed to abort:', err);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearMessages();
    clearSections();
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Title bar — themed header */}
      <div className="drag-region flex items-center justify-between px-4 py-2 border-b border-accent shrink-0 bg-header">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-accent tracking-wider">⚡ PiNGiN</span>
          {isStreaming && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs text-text-accent-dim">streaming</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 no-drag">
          {isStreaming && (
            <button
              onClick={handleAbort}
              className="p-1 rounded hover:bg-accent-subtle transition-colors text-accent hover:text-text-accent"
              title="Abort"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={handleClear}
            className="p-1 rounded hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-slate-200"
            title="Clear chat"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={() => setShowHamburgerMenu(true)}
            className="p-1 rounded hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-slate-200"
            title="Menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Context summary (if context was captured) */}
      {context && (
        <div className="px-3 py-2 border-b border-accent-subtle shrink-0 bg-footer">
          <div className="text-xs text-text-accent-dim space-y-0.5">
            {context.windowTitle && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{context.windowTitle}</span>
              </div>
            )}
            {context.selectedText && (
              <div className="flex items-start gap-1">
                <svg className="w-3 h-3 shrink-0 mt-0.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="truncate block max-w-full">{context.selectedText.substring(0, 120)}{context.selectedText.length > 120 ? '...' : ''}</span>
              </div>
            )}
            {context.browserUrl && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="truncate">{context.browserUrl}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Welcome message if no messages */}
        {messages.length === 0 && sections.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-3xl mb-3 text-accent">⚡</div>
            <h2 className="text-sm font-semibold text-text-accent mb-1">PiNGiN</h2>
            <p className="text-xs text-slate-500 max-w-xs">
              Your pi-agent companion. Type a message or press the shortcut to capture context and chat.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mr-2 mt-1">
                <span className="text-xs">⚡</span>
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent/15 text-text-accent rounded-br-sm'
                  : 'bg-slate-800/80 text-slate-200 rounded-bl-sm'
              } markdown-content`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Foldable sections */}
        {sections.map((section) => (
          <FoldableSection key={section.id} section={section} />
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-text-accent-dim text-xs animate-fade-in">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <span>thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area — themed footer */}
      <div className="px-3 py-2 border-t border-accent-subtle shrink-0 bg-footer">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="no-drag w-full bg-slate-800/60 border border-accent-subtle rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all overflow-y-auto"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={isStreaming ? handleAbort : handleSend}
            disabled={!inputText.trim() && !isStreaming}
            className={`no-drag p-2 rounded-xl transition-all ${
              isStreaming
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : inputText.trim()
                  ? 'bg-accent text-white hover:bg-accent-hover'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isStreaming ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
