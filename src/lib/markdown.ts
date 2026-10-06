import DOMPurify from 'dompurify';
import { Marked } from 'marked';

const markdown = new Marked({ gfm: true, breaks: false });

export function renderMarkdown(text: string): string {
  return DOMPurify.sanitize(markdown.parse(text, { async: false }));
}

export function suggestFileName(text: string): string {
  const heading = text.match(/^#\s+(.+)/m)?.[1];
  const slug = heading?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug ? `${slug}.md` : 'untitled.md';
}
