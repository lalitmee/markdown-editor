import { useEffect, useMemo, useRef, useState } from 'react';
import EditorPane from './components/EditorPane';
import PreviewPane from './components/PreviewPane';
import TopBar from './components/TopBar';
import Toast from './components/Toast';
import { renderMarkdown, suggestFileName } from './lib/markdown';
import { loadDraft, saveDraft } from './lib/autosave';
import { mapFsError, openFile, saveFile } from './lib/files';
import { downloadHtml } from './lib/export';

type Tone = 'info' | 'error';

// files.ts throws `new Error(mappedCopy)`, so the message is already exact
// copy; mapFsError covers any raw DOMException that slips through (null = abort = silent).
const errorMessage = (e: unknown): string | null =>
  (e instanceof Error && e.message) || mapFsError(e);

export default function App() {
  const [initialDraft] = useState(loadDraft);
  const [text, setText] = useState(initialDraft.text);
  const [fileName, setFileName] = useState(initialDraft.fileName);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [theme, setTheme] = useState(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [toast, setToast] = useState<{ message: string | null; tone: Tone }>({ message: null, tone: 'info' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const html = useMemo(() => renderMarkdown(text), [text]);

  const showToast = (message: string | null, tone: Tone) => setToast({ message, tone });

  useEffect(() => {
    if (toast.message === null) return;
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      setToast((current) => ({ ...current, message: null }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => saveDraft({ text, fileName }), 500);
    return () => clearTimeout(timer);
  }, [text, fileName]);

  const handleOpen = async () => {
    try {
      const result = await openFile();
      if (result === null) return; // picker cancelled: silent
      setText(result.text);
      setFileName(result.fileName);
      setFileHandle(result.handle);
      saveDraft({ text: result.text, fileName: result.fileName });
      textareaRef.current?.focus();
    } catch (e) {
      showToast(errorMessage(e), 'error');
    }
  };

  const handleSave = async () => {
    try {
      const handle = await saveFile(text, fileHandle);
      if (handle === null) return; // picker cancelled: silent
      const name = handle.name || fileName;
      setFileHandle(handle);
      setFileName(name);
      saveDraft({ text, fileName: name });
      showToast(`Saved ${name}`, 'info');
    } catch (e) {
      showToast(errorMessage(e), 'error');
    }
  };

  const handleExport = () => {
    try {
      downloadHtml(suggestFileName(text).replace(/\.md$/, '.html'), fileName ?? 'Untitled', html);
    } catch {
      showToast('Something went wrong accessing the file', 'error');
    }
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('markdown-editor:theme', next);
    setTheme(next);
  };

  return (
    <div className="app-shell">
      <TopBar
        fileName={fileName}
        onOpen={handleOpen}
        onSave={handleSave}
        onExport={handleExport}
        onToggleTheme={handleToggleTheme}
      />
      {/* Toolbar row stays empty until Task 10. */}
      <div className="app-toolbar" />
      <div className="app-main">
        <EditorPane text={text} onTextChange={setText} textareaRef={textareaRef} />
        <PreviewPane html={html} />
      </div>
      <Toast message={toast.message} tone={toast.tone} />
    </div>
  );
}
