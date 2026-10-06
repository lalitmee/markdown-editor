import { useEffect, useMemo, useRef, useState } from 'react';
import EditorPane from './components/EditorPane';
import PreviewPane from './components/PreviewPane';
import { renderMarkdown } from './lib/markdown';
import { loadDraft, saveDraft } from './lib/autosave';

export default function App() {
  const [initialDraft] = useState(loadDraft);
  const [text, setText] = useState(initialDraft.text);
  const [fileName, setFileName] = useState(initialDraft.fileName);
  // Task 9 wires open/save to these; declared now so the state shape stays stable.
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const html = useMemo(() => renderMarkdown(text), [text]);

  useEffect(() => {
    const timer = setTimeout(() => saveDraft({ text, fileName }), 500);
    return () => clearTimeout(timer);
  }, [text, fileName]);

  return (
    <div className="app-shell">
      {/* Slots filled by Tasks 9 (TopBar) and 10 (Toolbar); empty rows keep the grid pinned. */}
      <div className="app-bar" />
      <div className="app-toolbar" />
      <div className="app-main">
        <EditorPane text={text} onTextChange={setText} textareaRef={textareaRef} />
        <PreviewPane html={html} />
      </div>
    </div>
  );
}
