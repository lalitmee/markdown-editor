# Markdown Editor Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CRA/Remarkable prototype with a Vite + React + TypeScript daily-driver Markdown editor with a hand-built Material 3 UI, live preview, file open/save, export, autosave, and light/dark themes.

**Architecture:** Single-page React app; all state in `App.tsx`. Pure logic lives in `src/lib/*` (tested with Vitest); thin components render M3-styled UI from that logic. Markdown pipeline is `marked` → `DOMPurify.sanitize` on every keystroke; file I/O via the File System Access API; draft persistence in localStorage.

**Tech Stack:** Vite + React + TypeScript (ESM), `marked`, `dompurify`, Vitest + jsdom, plain CSS with M3 tokens, Google Fonts (Roboto + Material Symbols Outlined via `<link>`).

**Spec:** `docs/superpowers/specs/2026-10-07-markdown-editor-rewrite-design.md`

## Global Constraints

- Exactly three runtime npm deps: `react`, `react-dom`, `marked` + `dompurify` (four counting those two) — no UI library, no CSS framework, no router, no state library, no icon package.
- Editor input is a native `<textarea>`; file access is File System Access API only (Chrome/Edge). Both ceilings get a `ponytail:` comment naming the upgrade path.
- Seed color: **Google Blue #4285F4**; seed text: **`Type some *markdown* here!`**.
- localStorage keys: **`markdown-editor:draft`** (`{text, fileName}`), **`markdown-editor:theme`** (`'light' | 'dark'`).
- Autosave debounce: **500ms**. Responsive stacking breakpoint: **768px**. Toast auto-dismiss: **~3000ms**.
- Formatting wrap delimiters: bold `**`, italic `*`, inline code `` ` ``, link `[` … `](https://)`. Line prefixes: heading `## `, quote `> `, bullet `- `, numbered `1. `.
- Shortcuts: `Cmd/Ctrl+B/I/K/E` on the textarea; `Cmd/Ctrl+S` and `Cmd/Ctrl+O` on a document listener. All intercepted defaults are `preventDefault`ed.
- Error copy (exact): `Permission denied`, `File access needs Chrome or Edge`, `Something went wrong accessing the file`. `AbortError` → silent.
- Suggested file name: slugified first `# heading` + `.md`, else `untitled.md`.
- Test file location: `src/lib/__tests__/*.test.ts`. Component tests are out of scope (spec §7).
- Tests run with `npm test` (vitest run, jsdom environment) and must pass before each commit.

## Review Focus

Failure modes the spec implies that are easiest to ship broken — each is pinned to the owning task below:

1. **Malicious markdown reaching the DOM** — a `<script>` or `onerror=` payload in the source must vanish from both preview and exported HTML. Pinned in Task 2 (`markdown.test.ts` sanitization assertions) and Task 5 (`export.test.ts`).
2. **File-permission and unsupported-browser paths** — cancel must be silent, denial must toast `Permission denied`, Firefox/Safari must toast `File access needs Chrome or Edge`. Pinned in Task 6 (`files.test.ts` `mapFsError`/`isFsAccessSupported` cases).
3. **Corrupt localStorage draft** — hand-edited or truncated JSON must fall back to the seed text, not crash startup. Pinned in Task 4 (`autosave.test.ts` corrupt-JSON case).
4. **Toolbar on multi-line or empty selections** — formatting must prefix every selected line, and an empty selection must leave the cursor between the markers. Pinned in Task 3 (`selection.test.ts` cases).
5. **Browser-default shortcuts leaking through** — `Cmd/Ctrl+S` must not open the browser save dialog, `Cmd/Ctrl+B` must not act while the textarea is unfocused. Pinned as a manual verification step in Task 10 (document-listener behavior is unreliable to simulate in jsdom).

---

### Task 1: Scaffold Vite + React + TypeScript

**Files:**
- Delete: `package.json` (rewrite), `src/MarkdownEditor.js`, `src/index.js`, `src/registerServiceWorker.js`, `public/manifest.json`, `public/logo192.png`, `public/logo512.png`, `public/robots.txt` (keep `public/favicon.ico` if present)
- Create: `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Regenerate: `package-lock.json`

**Interfaces:**
- Produces: runnable app (`npm run dev`), `npm test` wired to Vitest; `App` placeholder component (replaced in Task 8).

- [ ] **Step 1: Rewrite `package.json`**

`name: "markdown-editor"`, `"type": "module"`, scripts: `dev: vite`, `build: tsc && vite build`, `preview: vite preview`, `test: vitest run`. Dependencies: `react`, `react-dom`, `marked`, `dompurify`. DevDependencies: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `jsdom`, `@types/react`, `@types/react-dom`. Remove `react-scripts`, `remarkable`, `react-remarkable`, `semantic-ui-react`, `semantic-ui-css`.

- [ ] **Step 2: Create `vite.config.ts`**

`defineConfig` from `vitest/config`; react plugin; `test: { environment: 'jsdom', passWithNoTests: true }`.

- [ ] **Step 3: Create `tsconfig.json`**

Strict mode on, `jsx: "react-jsx"`, `moduleResolution: "bundler"`, include `src`.

- [ ] **Step 4: Create `index.html`**

`<div id="root">`, `<script type="module" src="/src/main.tsx">`, `<title>Markdown Editor</title>`.

- [ ] **Step 5: Create placeholder `src/main.tsx` and `src/App.tsx`**

`main.tsx` renders `<App />` into `#root`. `App.tsx` exports a component rendering `<h1>Markdown Editor</h1>`.

- [ ] **Step 6: Delete CRA files**

Remove the files listed above; keep `src/` and `public/favicon.ico`.

- [ ] **Step 7: Install and verify**

Run: `npm install && npm run build && npm test`
Expected: install succeeds; `tsc` + Vite build pass; vitest exits clean (no tests, `passWithNoTests`).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "build: scaffold vite + react + typescript, remove cra"
```

---

### Task 2: Markdown rendering + file-name suggestion

**Files:**
- Create: `src/lib/markdown.ts`
- Test: `src/lib/__tests__/markdown.test.ts`

**Interfaces:**
- Produces: `renderMarkdown(text: string): string` — sanitized HTML; `suggestFileName(text: string): string` — first `# heading` slugified + `.md`, else `untitled.md`. Consumed by Tasks 5, 6, 8, 9.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown, suggestFileName } from '../markdown';

describe('renderMarkdown', () => {
  it('renders GFM', () => {
    expect(renderMarkdown('**bold** and `code`')).toContain('<strong>bold</strong>');
    expect(renderMarkdown('```js\ncode\n```')).toContain('<code>');
  });
  it('strips script tags and event handlers', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror=');
  });
});

describe('suggestFileName', () => {
  it('slugs the first heading', () => {
    expect(suggestFileName('intro text\n# My Notes!\n## sub')).toBe('my-notes.md');
  });
  it('falls back when there is no heading', () => {
    expect(suggestFileName('no heading here')).toBe('untitled.md');
    expect(suggestFileName('#')).toBe('untitled.md');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `markdown.ts` does not exist.

- [ ] **Step 3: Implement `src/lib/markdown.ts`**

`renderMarkdown`: `new marked.Marked({ gfm: true, breaks: false }).parse(text)` then `DOMPurify.sanitize(...)` (default config — it removes scripts and event handlers). `suggestFileName`: find first line matching `/^#\s+(.+)/`, slug = lowercase, replace non-`[a-z0-9]+` runs with `-`, trim `-`; empty slug or no match → `untitled.md`; append `.md`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all Task 2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown.ts src/lib/__tests__/markdown.test.ts
git commit -m "feat: sanitized markdown rendering and file-name suggestion"
```

---

### Task 3: Selection helpers for the toolbar

**Files:**
- Create: `src/lib/selection.ts`
- Test: `src/lib/__tests__/selection.test.ts`

**Interfaces:**
- Produces:
  - `type FormatOp = 'bold' | 'italic' | 'link' | 'code' | 'heading' | 'quote' | 'bullet' | 'numbered'`
  - `wrapSelection(text: string, start: number, end: number, open: string, close: string): { text: string; selectionStart: number; selectionEnd: number }`
  - `prefixLines(text: string, start: number, end: number, prefix: string): { text: string; selectionStart: number; selectionEnd: number }`
- Consumed by: Tasks 8, 10 (`App.applyFormat`).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { wrapSelection, prefixLines } from '../selection';

describe('wrapSelection', () => {
  it('wraps a selection and reselects the inner text', () => {
    const r = wrapSelection('hello world', 0, 5, '**', '**');
    expect(r.text).toBe('**hello** world');
    expect([r.selectionStart, r.selectionEnd]).toEqual([2, 7]);
  });
  it('places the cursor between markers when selection is empty', () => {
    const r = wrapSelection('ab', 1, 1, '`', '`');
    expect(r.text).toBe('a``b');
    expect([r.selectionStart, r.selectionEnd]).toEqual([2, 2]);
  });
});

describe('prefixLines', () => {
  it('prefixes every line touched by the selection', () => {
    const r = prefixLines('one\ntwo\nthree', 0, 7, '- ');
    expect(r.text).toBe('- one\n- two\nthree');
  });
  it('prefixes only the cursor line when collapsed mid-line', () => {
    const r = prefixLines('one\ntwo', 5, 5, '## ');
    expect(r.text).toBe('one\n## two');
    expect(r.selectionStart).toBe(8);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `selection.ts` does not exist.

- [ ] **Step 3: Implement `src/lib/selection.ts`**

`wrapSelection`: insert `open` at `start`, `close` at `end`; inner selection = `[start + open.length, start + open.length + (end - start)]`. `prefixLines`: compute line boundaries intersecting `[start, end)` (or the cursor's line when `start === end`), insert `prefix` at each line start; every position at or after an inserted prefix shifts by `prefix.length`, so the cursor keeps its relative position just after the prefix on its line. Pure string/array manipulation, no DOM.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (Tasks 2–3).

- [ ] **Step 5: Commit**

```bash
git add src/lib/selection.ts src/lib/__tests__/selection.test.ts
git commit -m "feat: toolbar selection helpers"
```

---

### Task 4: Autosave draft storage

**Files:**
- Create: `src/lib/autosave.ts`
- Test: `src/lib/__tests__/autosave.test.ts`

**Interfaces:**
- Produces: `SEED_TEXT = 'Type some *markdown* here!'`; `type Draft = { text: string; fileName: string | null }`; `loadDraft(): Draft` (never null — seed fallback); `saveDraft(draft: Draft): void`. Key: `markdown-editor:draft`. Consumed by Tasks 8, 9.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadDraft, saveDraft, SEED_TEXT } from '../autosave';

beforeEach(() => localStorage.clear());

describe('autosave', () => {
  it('round-trips a draft', () => {
    saveDraft({ text: '# hi', fileName: 'hi.md' });
    expect(loadDraft()).toEqual({ text: '# hi', fileName: 'hi.md' });
  });
  it('falls back to the seed on no draft', () => {
    expect(loadDraft()).toEqual({ text: SEED_TEXT, fileName: null });
  });
  it('falls back to the seed on corrupt JSON', () => {
    localStorage.setItem('markdown-editor:draft', '{not json');
    expect(loadDraft()).toEqual({ text: SEED_TEXT, fileName: null });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `autosave.ts` does not exist.

- [ ] **Step 3: Implement `src/lib/autosave.ts`**

`saveDraft` → `localStorage.setItem(KEY, JSON.stringify(draft))`. `loadDraft` → parse; on missing key, parse error, or shape mismatch (`typeof parsed.text !== 'string'`) return `{ text: SEED_TEXT, fileName: null }`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (Tasks 2–4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/autosave.ts src/lib/__tests__/autosave.test.ts
git commit -m "feat: draft autosave with seed fallback"
```

---

### Task 5: Standalone HTML export

**Files:**
- Create: `src/lib/export.ts`
- Test: `src/lib/__tests__/export.test.ts`

**Interfaces:**
- Produces: `buildStandaloneHtml(title: string, bodyHtml: string): string`; `downloadHtml(fileName: string, title: string, bodyHtml: string): void` (Blob + anchor click; `fileName` already ends in `.html`). Consumed by Task 9.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { buildStandaloneHtml } from '../export';
import { renderMarkdown } from '../markdown';

describe('buildStandaloneHtml', () => {
  it('produces a titled standalone document', () => {
    const html = buildStandaloneHtml('My Doc', '<h1>My Doc</h1>');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>My Doc</title>');
    expect(html).toContain('<h1>My Doc</h1>');
  });
  it('never emits sanitized-away payloads', () => {
    const html = buildStandaloneHtml('t', renderMarkdown('<img src=x onerror=alert(1)>'));
    expect(html).not.toContain('onerror=');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `export.ts` does not exist.

- [ ] **Step 3: Implement `src/lib/export.ts`**

`buildStandaloneHtml`: template literal — doctype, `<html lang="en">`, `<meta charset>`, `<title>{title}</title>`, small inline print-friendly CSS (system font stack, `max-width: 46rem`, `margin: auto`, `line-height: 1.6`), `<article>{bodyHtml}</article>`. `downloadHtml`: `new Blob([buildStandaloneHtml(title, bodyHtml)], { type: 'text/html' })` → `URL.createObjectURL` → temporary `<a download={fileName}>` click → `revokeObjectURL`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (Tasks 2–5).

- [ ] **Step 5: Commit**

```bash
git add src/lib/export.ts src/lib/__tests__/export.test.ts
git commit -m "feat: standalone html export"
```

---

### Task 6: File open/save via File System Access API

**Files:**
- Create: `src/lib/files.ts`
- Test: `src/lib/__tests__/files.test.ts`

**Interfaces:**
- Produces:
  - `isFsAccessSupported(): boolean`
  - `mapFsError(e: unknown): string | null` — `null` = silent (abort); otherwise the exact copy from Global Constraints
  - `openFile(): Promise<{ text: string; fileName: string; handle: FileSystemFileHandle } | null>` — `null` on cancel
  - `saveFile(text: string, handle: FileSystemFileHandle | null): Promise<FileSystemFileHandle | null>` — writes via existing handle or `showSaveFilePicker`; `null` on cancel; returns the handle for reuse
- Consumed by: Task 9.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { isFsAccessSupported, mapFsError } from '../files';

describe('mapFsError', () => {
  it('is silent on abort', () => {
    expect(mapFsError(new DOMException('cancel', 'AbortError'))).toBeNull();
  });
  it('maps permission denial', () => {
    expect(mapFsError(new DOMException('no', 'NotAllowedError'))).toBe('Permission denied');
  });
  it('maps unknown errors', () => {
    expect(mapFsError(new Error('boom'))).toBe('Something went wrong accessing the file');
  });
});

describe('isFsAccessSupported', () => {
  it('detects missing API in jsdom', () => {
    expect(isFsAccessSupported()).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `files.ts` does not exist.

- [ ] **Step 3: Implement `src/lib/files.ts`**

`isFsAccessSupported`: `'showOpenFilePicker' in window && 'showSaveFilePicker' in window`. `mapFsError`: switch on `(e as DOMException)?.name` — `AbortError` → `null`, `NotAllowedError` → `'Permission denied'`, default → `'Something went wrong accessing the file'`. `openFile`: unsupported → throw `Error('File access needs Chrome or Edge')`; picker with `types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown'] } }]`; catch abort → return `null`; other errors → rethrow `Error(mapFsError(e))`. Read file text, return `{ text, fileName: handle.name, handle }`. `saveFile`: unsupported → throw the same copy; existing handle → permission check (`queryPermission`/`requestPermission` with `{ mode: 'readwrite' }`) then write; no handle → `showSaveFilePicker` with `suggestedName: suggestFileName(text)` (Task 2); abort → `null`. Add a `ponytail:` comment: file access needs Chrome/Edge, upgrade path `<input type="file">` + download fallback.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (Tasks 2–6).

- [ ] **Step 5: Commit**

```bash
git add src/lib/files.ts src/lib/__tests__/files.test.ts
git commit -m "feat: file open/save with mapped fs errors"
```

---

### Task 7: Material 3 design tokens, base styles, theme bootstrap

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`
- Modify: `index.html` (Google Fonts links), `src/main.tsx` (theme bootstrap)

**Interfaces:**
- Produces: CSS custom properties `--md-sys-color-*` (light in `:root`, dark under `[data-theme="dark"]`), `--md-shape-{small,medium,large,full}`, `--md-typescale-*`; classes `.material-symbols-outlined`, app grid layout styles; theme bootstrap that runs before first paint. Consumed by Tasks 8–10.

- [ ] **Step 1: Add Google Fonts links to `index.html`**

Roboto (`wght@400;500;700`) and Material Symbols Outlined (fill 0, weight 400) via `fonts.googleapis.com/css2` `<link>` tags in `<head>`.

- [ ] **Step 2: Write `src/styles/tokens.css`**

M3 token set seeded from #4285F4: `primary`, `on-primary`, `primary-container`, `on-primary-container`, `secondary`, `surface`, `surface-container-low`, `surface-container`, `on-surface`, `on-surface-variant`, `outline`, `outline-variant`, `error`, `on-error`, `error-container` — distinct light/dark values, text tokens contrast-checked against their surfaces (AA). Shape tokens: small 8px, medium 12px, large 16px, full 999px. Type tokens mapped to: app-bar title (title-large), section headings (title-medium), body (body-large), labels/captions (label-medium).

- [ ] **Step 3: Write `src/styles/base.css`**

Reset, `box-sizing`, body → `--md-sys-color-surface` + Roboto, `.material-symbols-outlined` font settings (variation settings for the icon font, `user-select: none`), the app grid shell (top bar / toolbar / `1fr 1fr` panes with an outline divider; below 768px single column), pane surfaces on `surface-container-low`, shared M3 raised-button/icon-button hover styles used by Tasks 9–10. Import both files from `main.tsx`.

- [ ] **Step 4: Implement theme bootstrap in `main.tsx`**

Before `createRoot().render`: read `localStorage['markdown-editor:theme']`; if absent use `matchMedia('(prefers-color-scheme: dark)')`; set `document.documentElement.dataset.theme`.

- [ ] **Step 5: Verify**

Run: `npm run build && npm test`
Expected: build passes, tests still green.

- [ ] **Step 6: Commit**

```bash
git add index.html src/styles src/main.tsx
git commit -m "feat: material 3 tokens, base styles, theme bootstrap"
```

---

### Task 8: App shell — split live editor and preview

**Files:**
- Create: `src/components/EditorPane.tsx`, `src/components/PreviewPane.tsx`
- Modify: `src/App.tsx` (replace placeholder)

**Interfaces:**
- Consumes: `renderMarkdown` (Task 2), `loadDraft` (Task 4), tokens/layout CSS (Task 7).
- Produces:
  - `EditorPane` props: `{ text: string; onTextChange: (next: string) => void; textareaRef: React.RefObject<HTMLTextAreaElement | null> }`
  - `PreviewPane` props: `{ html: string }`
  - `App` state: `text`, `fileName` (init from `loadDraft()`)

- [ ] **Step 1: Implement `EditorPane`**

M3 filled-textarea styling (container + label "Markdown source"), bare `<textarea>` bound to `text`/`onTextChange`, exposes `textareaRef`. `ponytail:` comment: no source highlighting, upgrade path CodeMirror in this component.

- [ ] **Step 2: Implement `PreviewPane`**

Renders `html` via `dangerouslySetInnerHTML` — safe because the value always comes from `renderMarkdown` (state it in a comment).

- [ ] **Step 3: Implement `App` state and data flow**

`useState` from `loadDraft()`; `useMemo(() => renderMarkdown(text), [text])`; debounced effect — `setTimeout(500)` → `saveDraft({ text, fileName })`, cleared on change. Layout: TopBar/Toolbar slots empty for now, then `<EditorPane />` │ `<PreviewPane />`.

- [ ] **Step 4: Verify**

Run: `npm run build && npm test`
Expected: pass. Then `npm run dev`: typing renders live; refresh restores the draft; first load shows the seed text.

- [ ] **Step 5: Commit**

```bash
git add src/components/EditorPane.tsx src/components/PreviewPane.tsx src/App.tsx
git commit -m "feat: split live editor and preview with autosave"
```

---

### Task 9: TopBar and Toast — open, save, export, theme

**Files:**
- Create: `src/components/TopBar.tsx`, `src/components/Toast.tsx`
- Modify: `src/App.tsx` (wire actions, toast state, theme state)

**Interfaces:**
- Consumes: `openFile`, `saveFile` (Task 6), `downloadHtml` (Task 5), `suggestFileName` (Task 2), `Draft` (Task 4).
- Produces:
  - `TopBar` props: `{ fileName: string | null; theme: 'light' | 'dark'; onOpen: () => void; onSave: () => void; onExport: () => void; onToggleTheme: () => void }`
  - `Toast` props: `{ message: string; onClose: () => void }` — App renders it only while `toast` is non-null.
  - `App` state additions: `fileHandle`, `theme`, `toast`

- [ ] **Step 1: Implement `Toast`**

M3 snackbar: fixed bottom-center, `surface-container`/`on-surface` tokens, auto-dismiss via `useEffect` `setTimeout(3000)`.

- [ ] **Step 2: Implement `TopBar`**

M3 top app bar: title "Markdown Editor", `fileName` as subtitle (`draft` when null), right-side icon buttons — `folder_open`, `save`, `download`, theme toggle (`dark_mode`/`light_mode`).

- [ ] **Step 3: Wire actions in `App`**

`handleOpen`: `await openFile()` — non-null → set `text`/`fileName`/`fileHandle` and immediately `saveDraft`; `handleSave`: `await saveFile(text, fileHandle)` — update `fileHandle`, toast `Saved`; `handleExport`: `downloadHtml(suggestFileName(text).replace(/\.md$/, '.html'), fileName ?? 'Untitled', rendered)`; `handleToggleTheme`: flip `theme`, persist to `markdown-editor:theme`, set `document.documentElement.dataset.theme`. Every action: `try/catch` — `mapFsError`-thrown messages and unexpected errors toast; `null` returns (cancel) stay silent.

- [ ] **Step 4: Verify**

Run: `npm run build && npm test`
Expected: pass. Then `npm run dev` manual checklist: open a `.md` file → edits → Save writes back (re-Save keeps working via stored handle); Export downloads `.html` opening cleanly in a new tab; theme toggle persists across refresh; cancelling the open picker shows no toast; on a browser without the API, Save toasts `File access needs Chrome or Edge`.

- [ ] **Step 5: Commit**

```bash
git add src/components/TopBar.tsx src/components/Toast.tsx src/App.tsx
git commit -m "feat: top bar actions, toasts, theme toggle"
```

---

### Task 10: Formatting toolbar and keyboard shortcuts

**Files:**
- Create: `src/components/Toolbar.tsx`
- Modify: `src/App.tsx` (applyFormat, textarea ref, document listener), `src/components/EditorPane.tsx` (textarea keydown)

**Interfaces:**
- Consumes: `FormatOp`, `wrapSelection`, `prefixLines` (Task 3); `EditorPane.textareaRef`, `openFile`, `saveFile` (Tasks 8, 6).
- Produces: `Toolbar` props: `{ onFormat: (op: FormatOp) => void }`; `App.applyFormat(op: FormatOp): void`; `EditorPane` gains a new prop `onFormat: (op: FormatOp) => void`, passed to its textarea `onKeyDown`.

- [ ] **Step 1: Implement `App.applyFormat(op)`**

Read `selectionStart/End` from `textareaRef.current`. Wrap ops — bold `**`/`**`, italic `*`/`*`, code `` ` ``/`` ` ``, link `[`/`](https://)` via `wrapSelection`. Prefix ops — heading `## `, quote `> `, bullet `- `, numbered `1. ` via `prefixLines`. Apply returned `text` via `setText` and restore `selectionStart/End` in a `requestAnimationFrame` (textarea updates after React renders).

- [ ] **Step 2: Implement `Toolbar`**

Icon-button row (`format_bold`, `format_italic`, `title`, `link`, `code`, `format_quote`, `format_list_bulleted`, `format_list_numbered`), each `onClick={() => onFormat(op)}`.

- [ ] **Step 3: Wire shortcuts**

`EditorPane` textarea `onKeyDown`: no modifier → skip; `Cmd/Ctrl+B|I|K|E` → `onFormat('bold'|'italic'|'link'|'code')` + `preventDefault`. `App`: `useEffect` document listener for `Cmd/Ctrl+S` (call `handleSave`, preventDefault) and `Cmd/Ctrl+O` (call `handleOpen`, preventDefault); remove on unmount.

- [ ] **Step 4: Verify**

Run: `npm run build && npm test`
Expected: pass. Then `npm run dev` manual checklist: every toolbar button wraps/prefixes correctly including a multi-line selection; `Cmd+B` inside the textarea bolds the selection; `Cmd+B` while focus is in the preview does nothing; `Cmd+S` never opens the browser save dialog (works from any focus); `Cmd+O` opens the picker.

- [ ] **Step 5: Commit**

```bash
git add src/components/Toolbar.tsx src/App.tsx src/components/EditorPane.tsx
git commit -m "feat: formatting toolbar and keyboard shortcuts"
```

---

### Task 11: README rewrite and CRA cleanup audit

**Files:**
- Modify: `README.md`
- Audit: whole repo (no functional code changes expected)

- [ ] **Step 1: Audit for CRA leftovers**

Run: `grep -rn "react-scripts\|registerServiceWorker\|semantic-ui\|remarkable" src/ package.json README.md || true`
Expected: no matches (spec §8). Remove any found.

- [ ] **Step 2: Rewrite `README.md`**

What it is (one paragraph), features list (split live preview, toolbar/shortcuts, open/save, export, autosave, themes), Run locally (`npm ci && npm run dev`, `npm test`, `npm run build`), Requirements (Node, Chrome/Edge for file access), License note. Match the spec's copy for feature names and requirements.

- [ ] **Step 3: Final verification**

Run: `npm run build && npm test`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: rewrite readme for vite rewrite"
```
