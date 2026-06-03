import React from 'react';

interface JsonRendererProps {
  text: string;
}

// Try to parse a string as JSON, return parsed value or null
function tryParseJson(text: string): any {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch {}
  return null;
}

// Render a single JSON value with proper indentation
function JsonValue({ value, indent = 0, key }: { value: any; indent?: number; key?: string }): React.ReactNode {
  const pad = '  '.repeat(indent);

  if (value === null) {
    return <span className="text-slate-500">null</span>;
  }

  if (value === undefined) {
    return <span className="text-slate-500">undefined</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="text-orange-400">{value ? 'true' : 'false'}</span>;
  }

  if (typeof value === 'number') {
    return <span className="text-cyan-400">{value}</span>;
  }

  if (typeof value === 'string') {
    return (
      <span>
        <span className="text-slate-500">"</span>
        <span className="text-emerald-400">{escapeHtml(value)}</span>
        <span className="text-slate-500">"</span>
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-300">[]</span>;
    }
    return (
      <span>
        <span className="text-slate-300">[</span>
        {value.map((item, i) => (
          <span key={i}>
            <br />
            <span className="text-slate-600">{pad}  </span>
            <JsonValue value={item} indent={indent + 1} />
            {i < value.length - 1 && <span className="text-slate-400">,</span>}
          </span>
        ))}
        <br />
        <span className="text-slate-600">{pad}</span>
        <span className="text-slate-300">]</span>
      </span>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <span className="text-slate-300">{'{}'}</span>;
    }
    return (
      <span>
        <span className="text-slate-300">{'{'}</span>
        {entries.map(([k, v], i) => (
          <span key={k}>
            <br />
            <span className="text-slate-600">{pad}  </span>
            <span className="text-violet-400">"{escapeHtml(k)}"</span>
            <span className="text-slate-400">: </span>
            <JsonValue value={v} indent={indent + 1} />
            {i < entries.length - 1 && <span className="text-slate-400">,</span>}
          </span>
        ))}
        <br />
        <span className="text-slate-600">{pad}</span>
        <span className="text-slate-300">{'}'}</span>
      </span>
    );
  }

  return <span>{String(value)}</span>;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Detect if a string contains a JSON block (starts with { or [ at the beginning)
function extractJsonBlock(text: string): { json: any; before: string; after: string } | null {
  const trimmed = text.trim();

  // Full string is JSON
  const fullParsed = tryParseJson(trimmed);
  if (fullParsed !== null) {
    return { json: fullParsed, before: '', after: '' };
  }

  // Look for JSON block starting with { or [ at the start of a line
  const lines = text.split('\n');
  let jsonStart = -1;
  let jsonEnd = -1;
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts a JSON block
    if (jsonStart === -1) {
      const firstChar = line.trimStart()[0];
      if (firstChar === '{' || firstChar === '[') {
        jsonStart = i;
        if (firstChar === '{') braceCount = 1;
        if (firstChar === '[') bracketCount = 1;
      }
      continue;
    }

    // Track braces/brackets to find the end
    for (const ch of line) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === '{') braceCount++;
      if (ch === '}') braceCount--;
      if (ch === '[') bracketCount++;
      if (ch === ']') bracketCount--;

      if (braceCount === 0 && bracketCount === 0) {
        jsonEnd = i;
        break;
      }
    }

    if (jsonEnd !== -1) break;
  }

  if (jsonStart === -1 || jsonEnd === -1) return null;

  const jsonText = lines.slice(jsonStart, jsonEnd + 1).join('\n');
  const blockParsed = tryParseJson(jsonText);
  if (blockParsed === null) return null;

  const before = lines.slice(0, jsonStart).join('\n');
  const after = lines.slice(jsonEnd + 1).join('\n');

  return { json: blockParsed, before: before.trimEnd(), after: after.trimStart() };
}

const JsonRenderer: React.FC<JsonRendererProps> = ({ text }) => {
  const result = extractJsonBlock(text);

  if (!result) {
    return <span>{text}</span>;
  }

  const { json, before, after } = result;

  return (
    <span>
      {before && <span>{before}</span>}
      {before && <br />}
      <div className="my-2 rounded-lg border border-accent-subtle bg-slate-800/80 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-header border-b border-accent-subtle">
          <span className="text-xs font-medium text-text-accent">JSON</span>
          <span className="text-xs text-slate-500">
            {typeof json === 'object' && !Array.isArray(json)
              ? `${Object.keys(json).length} keys`
              : Array.isArray(json)
                ? `${json.length} items`
                : 'value'}
          </span>
        </div>
        {/* Content */}
        <pre className="px-3 py-2 text-xs leading-relaxed font-mono overflow-x-auto">
          <code>
            <JsonValue value={json} />
          </code>
        </pre>
      </div>
      {after && <br />}
      {after && <span>{after}</span>}
    </span>
  );
};

export default JsonRenderer;
