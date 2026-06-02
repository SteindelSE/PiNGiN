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

import React from 'react';
import { usePinginStore } from '../store';

const ContextPill: React.FC = () => {
  const {
    sessionInfo, contextUsage, settings,
    setShowHamburgerMenu, setShowSessionHistory,
  } = usePinginStore();

  // Determine progress bar color based on context usage
  const getProgressColor = (percent: number): string => {
    const warning = settings?.contextWarningPercent || 60;
    const danger = settings?.contextDangerPercent || 80;

    if (percent >= danger) return 'bg-red-500';
    if (percent >= warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const modelName = sessionInfo?.model?.name || 'Unknown';
  const modelShortName = modelName.includes('/') ? modelName.split('/').pop() || modelName : modelName;
  const thinkingLevelRaw = sessionInfo?.thinkingLevel || 'off';
  const thinkingLevel = thinkingLevelRaw.charAt(0).toUpperCase() + thinkingLevelRaw.slice(1);
  const percent = contextUsage?.percent ?? 0;
  const contextWindow = contextUsage?.contextWindow ?? 0;

  return (
    <div className="shrink-0 px-2 py-1.5 border-t border-slate-700/30">
      <div className="flex items-center gap-2 bg-slate-800/60 rounded-full px-3 py-1.5">
        {/* Model name */}
        <span className="text-xs font-medium text-slate-300 truncate max-w-[80px]">
          {modelShortName}
        </span>

        {/* Separator */}
        <span className="text-slate-600">|</span>

        {/* Thinking level */}
        <span className="text-xs text-slate-400">
          {thinkingLevel}
        </span>

        {/* Separator */}
        <span className="text-slate-600">|</span>

        {/* Context usage progress bar */}
        {contextWindow > 0 && (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getProgressColor(percent)}`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              {Math.round(percent)}%
            </span>
          </div>
        )}

        {/* Session history button */}
        <button
          onClick={() => setShowSessionHistory(true)}
          className="no-drag p-1 rounded hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-slate-200"
          title="Session History"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Hamburger menu */}
        <button
          onClick={() => setShowHamburgerMenu(true)}
          className="no-drag p-1 rounded hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-slate-200"
          title="Settings"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ContextPill;
