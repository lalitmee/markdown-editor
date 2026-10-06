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
