import { describe, it, expect } from 'vitest';
import { renderMarkdown, suggestFileName } from '../markdown';

describe('renderMarkdown', () => {
  it('renders GFM', () => {
    expect(renderMarkdown('**bold** and `code`')).toContain('<strong>bold</strong>');
    expect(renderMarkdown('```js\ncode\n```')).toContain('<code');
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
