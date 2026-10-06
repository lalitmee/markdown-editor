import type { FormatOp } from '../lib/selection';

type ToolbarProps = {
  onFormat: (op: FormatOp) => void;
};

const BUTTONS: ReadonlyArray<{ op: FormatOp; icon: string; label: string }> = [
  { op: 'bold', icon: 'format_bold', label: 'Bold' },
  { op: 'italic', icon: 'format_italic', label: 'Italic' },
  { op: 'heading', icon: 'title', label: 'Heading' },
  { op: 'link', icon: 'link', label: 'Link' },
  { op: 'code', icon: 'code', label: 'Inline code' },
  { op: 'quote', icon: 'format_quote', label: 'Blockquote' },
  { op: 'bullet', icon: 'format_list_bulleted', label: 'Bulleted list' },
  { op: 'numbered', icon: 'format_list_numbered', label: 'Numbered list' },
];

// Presentational row: every click is delegated to onFormat (App.applyFormat).
export default function Toolbar({ onFormat }: ToolbarProps) {
  return (
    <div className="format-toolbar" role="toolbar" aria-label="Formatting">
      {BUTTONS.map(({ op, icon, label }) => (
        <button
          key={op}
          type="button"
          className="button-icon"
          onClick={() => onFormat(op)}
          aria-label={label}
          title={label}
        >
          <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
        </button>
      ))}
    </div>
  );
}