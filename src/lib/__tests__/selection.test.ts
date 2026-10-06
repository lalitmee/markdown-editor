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
