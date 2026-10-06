const KEY = 'markdown-editor:draft';

export const SEED_TEXT = 'Type some *markdown* here!';

export type Draft = { text: string; fileName: string | null };

export function loadDraft(): Draft {
  const value = localStorage.getItem(KEY);
  if (value === null) return { text: SEED_TEXT, fileName: null };

  try {
    const draft = JSON.parse(value);
    return typeof draft?.text === 'string'
      ? draft
      : { text: SEED_TEXT, fileName: null };
  } catch {
    return { text: SEED_TEXT, fileName: null };
  }
}

export function saveDraft(draft: Draft): void {
  localStorage.setItem(KEY, JSON.stringify(draft));
}
