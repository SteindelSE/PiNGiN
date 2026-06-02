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

import React, { useState, useEffect } from 'react';
import { usePinginStore } from '../store';
import { FoldableSection as FoldableSectionType } from '@shared/types';

interface Props {
  section: FoldableSectionType;
}

const FoldableSection: React.FC<Props> = ({ section }) => {
  const { toggleSection } = usePinginStore();
  const [collapsed, setCollapsed] = useState(section.collapsed);

  useEffect(() => {
    setCollapsed(section.collapsed);
  }, [section.collapsed]);

  const colorMap: Record<string, { label: string; bg: string; border: string; icon: string }> = {
    thinking: {
      label: 'text-thinking',
      bg: 'bg-thinking/10',
      border: 'border-thinking/30',
      icon: '🧠',
    },
    toolcall: {
      label: 'text-toolcall',
      bg: 'bg-toolcall/10',
      border: 'border-toolcall/30',
      icon: '🔧',
    },
    toolresult: {
      label: 'text-toolresult',
      bg: 'bg-toolresult/10',
      border: 'border-toolresult/30',
      icon: '📋',
    },
    error: {
      label: 'text-error',
      bg: 'bg-error/10',
      border: 'border-error/30',
      icon: '❌',
    },
    compaction: {
      label: 'text-compaction',
      bg: 'bg-compaction/10',
      border: 'border-compaction/30',
      icon: '🗜️',
    },
    retry: {
      label: 'text-compaction',
      bg: 'bg-compaction/10',
      border: 'border-compaction/30',
      icon: '🔄',
    },
  };

  const colors = colorMap[section.type] || colorMap.thinking;

  const handleToggle = () => {
    setCollapsed(!collapsed);
    toggleSection(section.id);
  };

  return (
    <div className={`rounded-lg border ${colors.border} overflow-hidden animate-fade-in`}>
      <button
        onClick={handleToggle}
        className={`w-full flex items-center gap-2 px-3 py-2 ${colors.bg} hover:opacity-80 transition-opacity no-drag`}
      >
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-90'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-xs font-medium text-slate-300">{colors.icon} {section.label}</span>
        {!collapsed && section.content && (
          <span className="text-xs text-slate-500 ml-auto">
            {section.content.length > 200 ? `${section.content.length} chars` : ''}
          </span>
        )}
      </button>
      {!collapsed && section.content && (
        <div className="px-3 py-2 bg-slate-900/50">
          <pre className="text-xs text-slate-400 whitespace-pre-wrap break-all font-mono max-h-48 overflow-y-auto">
            {section.content}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FoldableSection;
