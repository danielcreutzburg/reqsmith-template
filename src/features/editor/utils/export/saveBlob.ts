/**
 * Browser-Helfer zum Herunterladen eines Blobs als Datei.
 * Ersetzt `file-saver` (CJS-Modul, das in Vite/ESM gelegentlich
 * Probleme beim dynamischen Import macht).
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Kurz warten, bevor die URL freigegeben wird – manche Browser brauchen das.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
