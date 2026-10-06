import { useEffect, useMemo, useRef, useState } from 'react';
import EditorPane from './components/EditorPane';
import PreviewPane from './components/PreviewPane';
import TopBar from './components/TopBar';
import Toast from './components/Toast';
import Toolbar from './components/Toolbar';
import { renderMarkdown, suggestFileName } from './lib/markdown';
import { loadDraft, saveDraft } from './lib/autosave';
import { mapFsError, openFile, saveFile } from './lib/files';
import { downloadHtml } from './lib/export';
import { prefixLines, wrapSelection, type FormatOp } from './lib/selection';

type Tone = 'info' | 'error';

// Spec-pinned delimiters/prefixes for the eight format operations.
const WRAP_DELIMS: Partial<Record<FormatOp, [string, string]>> = {
  bold: ['**', '**'],
  italic: ['*', '*'],
  code: ['`', '`'],
  link: ['[', '](https://)'],
};

const LINE_PREFIXES: Partial<Record<FormatOp, string>> = {
  heading: '## ',
  quote: '> ',
  bullet: '- ',
  numbered: '1. ',
};

// files.ts throws `new Error(mappedCopy)`, so the message is already exact
// copy. Raw DOMExceptions (even though `instanceof Error`) go through mapFsError:
// sanctioned copy or null = abort = silent.
const errorMessage = (e: unknown): string | null =>
  (e instanceof Error && !(e instanceof DOMException) && e.message) || mapFsError(e);

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
      setFileHandle(handle);
      setFileName(handle.name);
      saveDraft({ text, fileName: handle.name });
      showToast(`Saved ${handle.name}`, 'info');
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

  // Single format path for both toolbar buttons and keyboard shortcuts.
  const applyFormat = (op: FormatOp) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const delims = WRAP_DELIMS[op];
    const result = delims
      ? wrapSelection(text, start, end, delims[0], delims[1])
      : prefixLines(text, start, end, LINE_PREFIXES[op]!);
    setText(result.text);
    // React commits the controlled value before the next paint, so restoring the
    // caret synchronously here would race the update. rAF runs after that commit:
    // refocus (buttons steal focus) and restore the selection on the new value.
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      textarea?.focus();
      textarea?.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  // Save/Open act from anywhere (spec §3.4); format shortcuts live on the
  // textarea keydown in EditorPane. Re-attached on text/fileHandle so the
  // closures see fresh values.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.ctrlKey) return; // weird combos: leave alone
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        void handleSave();
      } else if (key === 'o') {
        event.preventDefault();
        void handleOpen();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [text, fileHandle]);

  return (
    <div className="app-shell">
      <TopBar
        fileName={fileName}
        onOpen={handleOpen}
        onSave={handleSave}
        onExport={handleExport}
        onToggleTheme={handleToggleTheme}
      />
      <div className="app-toolbar">
        <Toolbar onFormat={applyFormat} />
      </div>
      <div className="app-main">
        <EditorPane text={text} onTextChange={setText} textareaRef={textareaRef} onFormat={applyFormat} />
        <PreviewPane html={html} />
      </div>
      <Toast message={toast.message} tone={toast.tone} />
    </div>
  );
}
