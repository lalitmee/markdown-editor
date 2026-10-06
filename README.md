# Markdown Editor

A daily-driver Markdown editor built with Vite, React, and TypeScript. Write Markdown on the left, see a live, sanitized preview on the right; open and edit real `.md` files on your machine, save back to the same file, and export the rendered document as a standalone HTML file. The UI is a hand-built Material 3 design with light and dark themes.

## Features

- **Split live preview** — type on the left, rendered (sanitized) preview on the right
- **Formatting toolbar + keyboard shortcuts** — bold (`Cmd/Ctrl+B`), italic (`Cmd/Ctrl+I`), link (`Cmd/Ctrl+K`), inline code (`Cmd/Ctrl+E`); save (`Cmd/Ctrl+S`) and open (`Cmd/Ctrl+O`)
- **Open/save local files** — File System Access API, Chrome or Edge only
- **Export standalone HTML** — download the rendered document as a self-contained `.html` file
- **Autosave draft** — debounced draft autosave to `localStorage`, restored on launch
- **Light/dark Material 3 themes** — persisted, defaults to system preference

## Run locally

```bash
npm ci
npm run dev      # start the dev server
npm test         # run tests
npm run build    # type-check and build for production
```

## Requirements

- Node.js (for development)
- Chrome or Edge for open/save local files (File System Access API); other browsers can edit, preview, and export but cannot open or save files

## License

No license — private project.