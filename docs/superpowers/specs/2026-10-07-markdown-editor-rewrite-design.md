# Markdown Editor Rewrite — Design Spec

**Date:** 2026-10-07
**Status:** Approved (design), pending spec review
**Goal:** Rewrite `markdown-editor` as a usable daily Markdown editor on Vite + React + TypeScript with a hand-built Material 3 UI.

## 1. Purpose & Success Criteria

Replace the existing CRA/class-component prototype (one textarea + Remarkable render) with a full daily-driver editor. Success looks like:

- Open a local `.md` file, edit with formatting toolbar/shortcuts, see live sanitized preview, save back to the same file.
- Never lose work: draft autosaves to localStorage on every keystroke burst.
- Export the rendered document as a standalone `.html` file.
- The whole UI reads as Material Design 3: Google Fonts typography, Material Symbols icons, M3 color/shape tokens — hand-built components, no UI library.
- Light and dark themes, persisted.

**Out of scope (explicitly):** word-count bar, multi-file library/recents, resizable split divider, Firefox/Safari file-write fallback, source-syntax highlighting (textarea input).

## 2. Constraints & Decisions (from brainstorming)

| Decision | Choice |
| --- | --- |
| Goal | Usable daily editor (features + design) |
| Design system | Material Design 3 implemented by hand (CSS tokens, no component library, no `@material/web`) |
| Editor input | Native `<textarea>` (not CodeMirror) |
| Markdown rendering | `marked` + `dompurify` (same as sibling project `markdown-previewer`) |
| Build/tooling | Vite + React + TypeScript, ESM |
| Testing | Vitest, logic-level tests only |
| File access | File System Access API only (Chrome/Edge), same as markdown-previewer |

**Known ceilings** (recorded in code as `ponytail:` comments):

- File System Access API → open/save requires Chrome/Edge. Upgrade path: `<input type="file">` + download fallback.
- `<textarea>` input → no source highlighting. Upgrade path: swap `EditorPane` internals for CodeMirror.

## 3. Architecture

### 3.1 Structure

```
src/
  main.tsx              # mount, theme bootstrap from localStorage/system
  App.tsx               # owns all state, composes layout
  styles/
    tokens.css          # M3 color/type/shape tokens — light + dark
    base.css            # reset, typography, layout, pane grid
  lib/
    markdown.ts         # renderMarkdown(text): marked → DOMPurify.sanitize
    files.ts            # openFile(), saveFile() — File System Access API
    autosave.ts         # loadDraft(), saveDraft() — localStorage
    export.ts           # buildStandaloneHtml(), downloadHtml()
    selection.ts        # wrapSelection(), insertAtCursor() for toolbar
  components/
    TopBar.tsx          # app bar: title, file name, open/save/export/theme
    Toolbar.tsx         # formatting icon buttons (mouse only)
    EditorPane.tsx      # textarea, M3 filled-field styling
    PreviewPane.tsx     # renders sanitized HTML
    Toast.tsx           # M3 snackbar: status + error messages
```

No router, no state library, no CSS framework. Three runtime npm deps total: `marked`, `dompurify`, and dev deps for Vite/React/TS/Vitest.

### 3.2 State (all in `App.tsx`)

- `text: string` — editor content
- `fileName: string | null` — current document name
- `fileHandle: FileSystemFileHandle | null` — session-only handle for save
- `theme: 'light' | 'dark'`
- `toast: { message, tone } | null`

### 3.3 Data flow

```
textarea.onChange ──► setText ──► useMemo(renderMarkdown) ──► PreviewPane
                          │
                          └──► debounced (500ms) ──► saveDraft(localStorage)
```

Preview renders synchronously on each keystroke (marked is fast; DOMPurify guarantees safety). Rendering happens in a `useMemo` keyed on `text`.

### 3.4 Toolbar / shortcuts

- Buttons call helpers in `selection.ts` against the textarea ref: read `selectionStart/End`, wrap or insert markdown, restore cursor, call `setText`.
- Formatting shortcuts (`Cmd/Ctrl+B` bold, `I` italic, `K` link, `E` inline code) are intercepted on the **textarea's `onKeyDown`** — they only apply while the editor has focus.
- App-level shortcuts (`Cmd/Ctrl+S` save, `Cmd/Ctrl+O` open) are intercepted by a **document-level listener** in `App.tsx` so they work wherever focus is.
- All intercepted defaults are `preventDefault`ed.

## 4. Material 3 UI Design

- **Color:** M3 tonal palette as CSS custom properties (`--md-sys-color-*`) in `tokens.css`. Light values in `:root`; dark values under `[data-theme="dark"]`. Seed color **Google Blue #4285F4** — reseed by changing one token group.
- **Typography:** Roboto via Google Fonts `<link>`; M3 type-scale tokens (`--md-typescale-*`) mapped to component roles (app-bar title, body, label, etc.).
- **Shape:** M3 corner-radius tokens: small 8px, medium 12px, large 16px, full 999px.
- **Icons:** Material Symbols Outlined via Google Fonts ligature spans — no icon package.

### Layout

```
┌──────────────────────────────────────────────┐
│ TopBar: "Markdown Editor" · filename   [open save export theme] │
├──────────────────────────────────────────────┤
│ Toolbar: B I H link code quote • •1         │
├───────────────────────┬──────────────────────┤
│ EditorPane (textarea) │ PreviewPane (HTML)   │
│ surface-container-low │ surface-container-low│
└───────────────────────┴──────────────────────┘
```

- Split: CSS Grid `1fr 1fr`, outline divider between panes.
- Below 768px: panes stack vertically (editor on top).
- Surfaces: app background `--md-sys-color-surface`; panes `--md-sys-color-surface-container-low`.

## 5. Feature Mechanics

1. **Open** — `showOpenFilePicker({ types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown'] } }] })`; read text; set `text`, `fileName`, `fileHandle`. Cancellation (`AbortError`) is silent.
2. **Save** — if `fileHandle`: check/request write permission, write `text`. Otherwise `showSaveFilePicker` with suggested name from the first `# heading` (slugified) or `untitled.md`; store the returned handle. Toast on success/failure.
3. **Export HTML** — wrap sanitized HTML in a minimal standalone document (inline readable CSS, doctype, `<title>` = fileName) → `Blob` → download `<name>.html`.
4. **Autosave** — key `markdown-editor:draft` → `{ text, fileName }`. Debounced 500ms after edits; loaded on startup; overwritten when a new file is opened. Seed text when no draft: `Type some *markdown* here!`
5. **Theme** — first visit: `prefers-color-scheme`. Toggle: light ↔ dark, written to `markdown-editor:theme` and applied as `data-theme` on `<html>`.
6. **Shortcuts** — as in §3.4.

## 6. Error Handling

- All File System Access calls in `try/catch`; map `AbortError` → silent, `NotAllowedError` → "Permission denied", unsupported API → "File access needs Chrome or Edge".
- Every user-visible outcome goes through `Toast` (auto-dismiss snackbar, ~3s).
- Preview and export HTML always pass through `renderMarkdown` (DOMPurify) — no un-sanitized path to the DOM.

## 7. Testing

Vitest (`vitest run`), matching markdown-previewer's setup. Logic-level tests only:

| File | Checks |
| --- | --- |
| `selection.test.ts` | wrap at cursor, wrap multi-line selection, insert when empty, cursor restored |
| `markdown.test.ts` | GFM renders; `<script>`/`onerror=` stripped by sanitization |
| `export.test.ts` | doctype + title present; content is sanitized HTML |
| `autosave.test.ts` | draft roundtrip; corrupt JSON degrades to seed text |

Component tests skipped (components are thin wrappers over this logic).

## 8. Migration Notes

- Delete CRA artifacts: `react-scripts`, `public/` CRA boilerplate, `registerServiceWorker.js`, old `MarkdownEditor.js`, Semantic UI deps, `react-remarkable`/`remarkable`.
- Keep git history; rewrite happens in place on a feature branch.
- README rewritten at the end: screenshots optional, run instructions (`npm ci && npm run dev`), Chrome/Edge requirement, feature list.

## 9. Non-Goals

- No word count, no file library/recents, no resizable split, no PDF export, no collaborative/sync features, no PWA/service worker, no i18n.
