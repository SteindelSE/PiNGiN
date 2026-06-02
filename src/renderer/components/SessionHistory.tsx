import React, { useState } from 'react';
import { usePinginStore } from '../store';

const SessionHistory: React.FC = () => {
  const {
    showSessionHistory, setShowSessionHistory,
    sessions, setSessions,
  } = usePinginStore();

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const cursorSessions = sessions.filter((s) => s.type === 'cursor');
  const bgSessions = sessions.filter((s) => s.type === 'background');

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSessionClick = async (sessionId: string) => {
    try {
      await window.pingin.resumeSession(sessionId);
      setShowSessionHistory(false);
    } catch (err) {
      console.error('Failed to resume session:', err);
    }
  };

  const handleDeleteClick = (sessionId: string) => {
    setDeleteConfirm(sessionId);
  };

  const handleDeleteConfirm = async (sessionId: string) => {
    try {
      await window.pingin.deleteSession(sessionId);
      const updated = await window.pingin.getAllSessions();
      setSessions(updated);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
    setDeleteConfirm(null);
  };

  if (!showSessionHistory) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={() => setShowSessionHistory(false)}
      />

      {/* Slide-out panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-accent-subtle z-50 animate-slide-in overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent-subtle bg-header">
          <h3 className="text-sm font-semibold text-text-accent">Session History</h3>
          <button
            onClick={() => setShowSessionHistory(false)}
            className="p-1 rounded hover:bg-accent-subtle text-slate-400 hover:text-text-accent transition-colors no-drag"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-4">
          {/* Cursor sessions (purple) */}
          {cursorSessions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                Cursor Sessions
              </h4>
              <div className="space-y-1">
                {cursorSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent-subtle transition-colors no-drag"
                  >
                    <button
                      onClick={() => handleSessionClick(session.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="text-sm text-slate-200 truncate">{session.name}</div>
                      <div className="text-xs text-text-accent-dim">
                        {formatTime(session.lastActivity)} · {session.messageCount} msgs
                      </div>
                    </button>
                    {session.isStreaming && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                    )}
                    <button
                      onClick={() => handleDeleteClick(session.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                      title="Delete session"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Background sessions (grey) */}
          {bgSessions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Background Sessions
              </h4>
              <div className="space-y-1">
                {bgSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors no-drag"
                  >
                    <button
                      onClick={() => handleSessionClick(session.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="text-sm text-slate-300 truncate">{session.name}</div>
                      <div className="text-xs text-text-accent-dim">
                        {formatTime(session.lastActivity)} · {session.messageCount} msgs
                      </div>
                    </button>
                    {session.isStreaming && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                    )}
                    <button
                      onClick={() => handleDeleteClick(session.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                      title="Delete session"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {deleteConfirm && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-300 mb-2">Delete this session?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteConfirm(deleteConfirm)}
                  className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30 transition-colors no-drag"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-3 py-1 bg-slate-700/50 text-slate-400 rounded text-xs hover:bg-slate-700 transition-colors no-drag"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-2xl mb-2 text-accent">📋</div>
              <p className="text-sm text-text-accent">No sessions yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Sessions will appear here when you use PiNGiN
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SessionHistory;
