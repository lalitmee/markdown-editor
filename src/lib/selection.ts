export type FormatOp = 'bold' | 'italic' | 'link' | 'code' | 'heading' | 'quote' | 'bullet' | 'numbered';

export function wrapSelection(text: string, start: number, end: number, open: string, close: string) {
  const innerStart = start + open.length;
  return {
    text: text.slice(0, start) + open + text.slice(start, end) + close + text.slice(end),
    selectionStart: innerStart,
    selectionEnd: innerStart + end - start,
  };
}

export function prefixLines(text: string, start: number, end: number, prefix: string) {
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') lineStarts.push(i + 1);
  }

  let first = 0;
  let last = 0;
  for (let i = 0; i < lineStarts.length; i++) {
    if (lineStarts[i] <= start) first = i;
    if (lineStarts[i] <= (start === end ? start : end - 1)) last = i;
  }
  const insertedAt = lineStarts.slice(first, last + 1);
  let result = '';
  let previous = 0;
  for (const lineStart of insertedAt) {
    result += text.slice(previous, lineStart) + prefix;
    previous = lineStart;
  }

  const shift = (position: number) => position + insertedAt.filter((lineStart) => lineStart <= position).length * prefix.length;
  return {
    text: result + text.slice(previous),
    selectionStart: shift(start),
    selectionEnd: shift(end),
  };
}
