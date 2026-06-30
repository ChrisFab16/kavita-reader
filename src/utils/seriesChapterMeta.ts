/** File type labels/colors for chapter rows (from Kavita format + fileName). */

export function getFileExtension(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return '';
  const match = fileName.match(/\.([^.]+)$/);
  return match ? match[1].toUpperCase() : '';
}

export function getFileTypeLabel(chapter: {
  fileName?: string;
  format?: number;
  files?: unknown[];
}): string {
  if (chapter.fileName && typeof chapter.fileName === 'string') {
    const ext = getFileExtension(chapter.fileName);
    if (ext) return ext;

    const lowerName = chapter.fileName.toLowerCase();
    if (lowerName.includes('epub')) return 'EPUB';
    if (lowerName.includes('pdf')) return 'PDF';
    if (lowerName.includes('cbz') || lowerName.includes('zip')) return 'CBZ';
    if (lowerName.includes('cbr') || lowerName.includes('rar')) return 'CBR';
    if (lowerName.includes('cb7') || lowerName.includes('7z')) return 'CB7';
  }

  if (chapter.format !== undefined) {
    switch (chapter.format) {
      case 2:
        return 'EPUB';
      case 3:
        return 'PDF';
      case 1:
        return 'CBZ';
      case 4:
        return 'Images';
    }
  }

  if (chapter.files && Array.isArray(chapter.files) && chapter.files.length > 0) {
    const firstFile = chapter.files[0];
    if (typeof firstFile === 'string') {
      const ext = getFileExtension(firstFile);
      if (ext) return ext;
    }
  }

  return 'Book';
}

export function getFileTypeColor(
  chapter: { fileName?: string; format?: number; files?: unknown[] },
  fallback: string
): string {
  const fileType = getFileTypeLabel(chapter);

  switch (fileType) {
    case 'EPUB':
      return '#9C27B0';
    case 'PDF':
      return '#F44336';
    case 'CBZ':
    case 'ZIP':
      return '#2196F3';
    case 'CBR':
    case 'RAR':
      return '#FF9800';
    case 'CB7':
    case '7Z':
      return '#4CAF50';
    case 'CBT':
    case 'TAR':
      return '#00BCD4';
    case 'Images':
      return '#795548';
    case 'MOBI':
    case 'AZW':
    case 'AZW3':
      return '#673AB7';
    default:
      return fallback;
  }
}

export function getFileIcon(chapter: {
  fileName?: string;
  format?: number;
  files?: unknown[];
}): string {
  const fileType = getFileTypeLabel(chapter);

  switch (fileType) {
    case 'EPUB':
    case 'MOBI':
    case 'AZW':
    case 'AZW3':
      return 'book-open-variant';
    case 'PDF':
      return 'file-pdf-box';
    case 'CBZ':
    case 'CBR':
    case 'CB7':
    case 'CBT':
    case 'ZIP':
    case 'RAR':
    case '7Z':
    case 'TAR':
      return 'book-open-page-variant';
    case 'Images':
      return 'image-multiple';
    default:
      return 'book';
  }
}
