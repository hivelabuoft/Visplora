'use client';
import clsx from 'clsx';

export type Mode = 'interact' | 'move' | 'arrow';

interface ToolbarProps {
  mode: Mode;
  onModeChange: (m: Mode) => void;
}

function Toolbar({ mode, onModeChange }: ToolbarProps) {
  const getToolIcon = (toolMode: Mode) => {
    switch (toolMode) {
      case 'interact':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
            <path d="M13 13l6 6"/>
          </svg>
        );
      case 'move':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5,9 2,12 5,15"/>
            <polyline points="9,5 12,2 15,5"/>
            <polyline points="15,19 12,22 9,19"/>
            <polyline points="19,9 22,12 19,15"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <line x1="12" y1="2" x2="12" y2="22"/>
          </svg>
        );
      case 'arrow':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12,5 19,12 12,19"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getToolLabel = (toolMode: Mode) => {
    switch (toolMode) {
      case 'interact':
        return 'Interact';
      case 'move':
        return 'Move';
      case 'arrow':
        return 'Arrow';
      default:
        return toolMode;
    }
  };

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40
                    flex flex-col gap-2 bg-white p-3 rounded-lg shadow">
      {(['interact', 'move', 'arrow'] as Mode[]).map(m => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
          className={clsx(
            'w-32 py-2 px-3 text-sm rounded-md border flex items-center gap-2 justify-center',
            m === mode
              ? 'bg-indigo-600 text-white border-indigo-700'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
          )}
        >
          {getToolIcon(m)}
          <span>{getToolLabel(m)}</span>
        </button>
      ))}
    </div>
  );
}

export default Toolbar;