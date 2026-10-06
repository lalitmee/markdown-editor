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
