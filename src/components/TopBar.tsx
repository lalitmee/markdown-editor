type TopBarProps = {
  fileName: string | null;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onToggleTheme: () => void;
};

// Presentational bar only: handlers come from App. The theme icon shows the
// *action* (the theme you switch to), not the current theme.
export default function TopBar({ fileName, onOpen, onSave, onExport, onToggleTheme }: TopBarProps) {
  const themeIcon = document.documentElement.dataset.theme === 'dark' ? 'light_mode' : 'dark_mode';

  return (
    <header className="app-bar">
      <div className="app-bar-identity">
        <span className="app-title">Markdown Editor</span>
        <span className="label app-bar-file">{fileName ?? 'Untitled'}</span>
      </div>
      <div className="app-bar-actions">
        <button type="button" className="button-icon" onClick={onOpen} aria-label="Open file" title="Open file">
          <span className="material-symbols-outlined" aria-hidden="true">folder_open</span>
        </button>
        <button type="button" className="button-icon" onClick={onSave} aria-label="Save file" title="Save file">
          <span className="material-symbols-outlined" aria-hidden="true">save</span>
        </button>
        <button type="button" className="button-icon" onClick={onExport} aria-label="Export as HTML" title="Export as HTML">
          <span className="material-symbols-outlined" aria-hidden="true">download</span>
        </button>
        <button type="button" className="button-icon" onClick={onToggleTheme} aria-label="Toggle theme" title="Toggle theme">
          <span className="material-symbols-outlined" aria-hidden="true">{themeIcon}</span>
        </button>
      </div>
    </header>
  );
}
