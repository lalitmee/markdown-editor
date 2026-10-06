export function buildStandaloneHtml(title: string, bodyHtml: string): string {
  const escapedTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedTitle}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; }
    article { max-width: 46rem; margin: auto; }
  </style>
</head>
<body>
  <article>${bodyHtml}</article>
</body>
</html>`;
}

export function downloadHtml(fileName: string, title: string, bodyHtml: string): void {
  const url = URL.createObjectURL(new Blob([buildStandaloneHtml(title, bodyHtml)], { type: 'text/html' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
