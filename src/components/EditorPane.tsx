import type { FormatOp } from '../lib/selection';

type EditorPaneProps = {
  text: string;
  onTextChange: (next: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onFormat: (op: FormatOp) => void;
};

// Mod+key → format op. Shortcuts apply only while the textarea itself has focus
// (spec §3.4); App's document listener handles Cmd/Ctrl+S|O from anywhere.
const FORMAT_KEYS: Partial<Record<string, FormatOp>> = {
  b: 'bold',
  i: 'italic',
  k: 'link',
  e: 'code',
};

// ponytail: no source highlighting (plain textarea); upgrade path is CodeMirror in this component.
export default function EditorPane({ text, onTextChange, textareaRef, onFormat }: EditorPaneProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.metaKey && event.ctrlKey) return; // weird combos: leave alone
    if (!(event.metaKey || event.ctrlKey)) return;
    const op = FORMAT_KEYS[event.key.toLowerCase()];
    if (op) {
      event.preventDefault();
      onFormat(op);
    }
  };

  return (
    <section className="app-pane editor-field">
      <label className="label" htmlFor="editor-source">
        Markdown source
      </label>
      <textarea
        id="editor-source"
        ref={textareaRef}
        className="editor-textarea"
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
    </section>
  );
}