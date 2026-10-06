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
