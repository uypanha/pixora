import { PixoraDocument } from '../types/document';

export function serializePixoraDocument(doc: PixoraDocument): string {
  const exportData = {
    ...doc,
    format: 'pixora' as const,
    version: 1,
    metadata: {
      ...doc.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
  return JSON.stringify(exportData, null, 2);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename;
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function savePixoraFile(doc: PixoraDocument): void {
  const json = serializePixoraDocument(doc);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const filename = `${doc.metadata.name || 'Untitled Project'}.pixora`;
  downloadBlob(blob, filename);
}
