import { suggestFileName } from './markdown';

type FilePickerWindow = Window & {
  showOpenFilePicker(options: {
    types: { description: string; accept: Record<string, string[]> }[];
  }): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options: { suggestedName: string }): Promise<FileSystemFileHandle>;
};

type WritableFileHandle = FileSystemFileHandle & {
  queryPermission(descriptor: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(descriptor: { mode: 'readwrite' }): Promise<PermissionState>;
};

const unsupportedMessage = 'File access needs Chrome or Edge';

// ponytail: Chrome/Edge only; add <input type="file"> + download fallback if broader browser support is needed.
export function isFsAccessSupported(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

export function mapFsError(e: unknown): string | null {
  switch ((e as DOMException)?.name) {
    case 'AbortError':
      return null;
    case 'NotAllowedError':
      return 'Permission denied';
    default:
      return 'Something went wrong accessing the file';
  }
}

export async function openFile(): Promise<{ text: string; fileName: string; handle: FileSystemFileHandle } | null> {
  if (!isFsAccessSupported()) throw new Error(unsupportedMessage);

  try {
    const [handle] = await (window as unknown as FilePickerWindow).showOpenFilePicker({
      types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown'] } }],
    });
    const file = await handle.getFile();
    return { text: await file.text(), fileName: handle.name, handle };
  } catch (e) {
    const message = mapFsError(e);
    if (message === null) return null;
    throw new Error(message);
  }
}

export async function saveFile(text: string, handle: FileSystemFileHandle | null): Promise<FileSystemFileHandle | null> {
  if (!isFsAccessSupported()) throw new Error(unsupportedMessage);

  try {
    const fileHandle = handle ?? await (window as unknown as FilePickerWindow).showSaveFilePicker({
      suggestedName: suggestFileName(text),
    });

    if (handle) {
      const permissionHandle = handle as WritableFileHandle;
      const options = { mode: 'readwrite' as const };
      if (await permissionHandle.queryPermission(options) !== 'granted'
        && await permissionHandle.requestPermission(options) !== 'granted') {
        throw new DOMException('Permission denied', 'NotAllowedError');
      }
    }

    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
    return fileHandle;
  } catch (e) {
    const message = mapFsError(e);
    if (message === null) return null;
    throw new Error(message);
  }
}
