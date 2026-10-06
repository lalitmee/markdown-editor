import Toolbar from './Toolbar';
import type { FormatOp } from '../lib/selection';

type EditorPaneProps = {
  text: string;
  onTextChange: (next: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onFormat: (op: FormatOp) => void;
};

// ponytail: no source highlighting (plain textarea); upgrade path is CodeMirror in this component.
export default function EditorPane({ text, onTextChange, textareaRef, onFormat }: EditorPaneProps) {
  return (
    <section className="app-pane editor-field">
      <Toolbar onFormat={onFormat} />
      <label className="label" htmlFor="editor-source">
        Markdown source
      </label>
      <textarea
        id="editor-source"
        ref={textareaRef}
        className="editor-textarea"
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        spellCheck={false}
      />
    </section>
  );
}