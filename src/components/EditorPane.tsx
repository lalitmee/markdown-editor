// ponytail: no source highlighting (plain textarea); upgrade path is CodeMirror in this component.
type EditorPaneProps = {
  text: string;
  onTextChange: (next: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
};

export default function EditorPane({ text, onTextChange, textareaRef }: EditorPaneProps) {
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
        spellCheck={false}
      />
    </section>
  );
}
