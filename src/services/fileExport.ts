/**
 * File export service
 * Handles saving notes as markdown or text files
 */

import { TranscriptionSegment } from '../types';

/**
 * Convert segments to markdown format
 */
export function toMarkdown(segments: TranscriptionSegment[], title?: string): string {
  const lines: string[] = [];
  
  // Add title if provided
  if (title) {
    lines.push(`# ${title}`);
    lines.push('');
  }
  
  // Add metadata
  const now = new Date();
  lines.push(`**Date:** ${now.toLocaleDateString('el-GR')}`);
  lines.push(`**Time:** ${now.toLocaleTimeString('el-GR')}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Add content
  if (segments.length === 0) {
    lines.push('*No transcription yet*');
  } else {
    segments.forEach((segment) => {
      lines.push(segment.text);
      lines.push('');
    });
  }
  
  return lines.join('\n');
}

/**
 * Convert segments to plain text format
 */
export function toPlainText(segments: TranscriptionSegment[]): string {
  return segments.map(s => s.text).join('\n\n');
}

/**
 * Download file to local filesystem
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/markdown'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(extension: 'md' | 'txt' = 'md'): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
  return `voice-notes-${dateStr}-${timeStr}.${extension}`;
}

/**
 * Export and download notes
 */
export function exportNotes(
  segments: TranscriptionSegment[],
  format: 'markdown' | 'text' = 'markdown',
  title?: string
): void {
  const content = format === 'markdown' 
    ? toMarkdown(segments, title)
    : toPlainText(segments);
  
  const extension = format === 'markdown' ? 'md' : 'txt';
  const mimeType = format === 'markdown' ? 'text/markdown' : 'text/plain';
  const filename = generateFilename(extension);
  
  downloadFile(content, filename, mimeType);
}
