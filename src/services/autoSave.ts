/**
 * Local auto-save service
 * Saves notes to a local file automatically
 */

import { TranscriptionSegment } from '../types';
import { toMarkdown, toPlainText } from './fileExport';

let autoSaveInterval: ReturnType<typeof setInterval> | null = null;
let lastSavedContent = '';

/**
 * Start auto-saving to a local file
 * Note: This only works in environments with file system access (Electron, Node.js)
 * For web browsers, we'll use localStorage as a fallback
 */
export function startAutoSave(
  getSegments: () => TranscriptionSegment[],
  intervalMs: number = 60000, // 1 minute default
  format: 'markdown' | 'text' = 'markdown'
): void {
  // Stop any existing auto-save
  stopAutoSave();

  autoSaveInterval = setInterval(() => {
    const segments = getSegments();
    if (segments.length === 0) return;

    const content = format === 'markdown' 
      ? toMarkdown(segments, 'Voice Notes')
      : toPlainText(segments);

    // Only save if content has changed
    if (content !== lastSavedContent) {
      saveLocally(content, format);
      lastSavedContent = content;
    }
  }, intervalMs);
}

/**
 * Stop auto-saving
 */
export function stopAutoSave(): void {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

/**
 * Save content locally
 * In browser: uses localStorage
 * In Electron/Node: would use file system
 */
function saveLocally(content: string, format: 'markdown' | 'text'): void {
  // Browser environment - use localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const key = `fonii-autosave-${format}`;
    window.localStorage.setItem(key, content);
    window.localStorage.setItem('fonii-autosave-timestamp', new Date().toISOString());
    console.log(`Auto-saved to localStorage at ${new Date().toLocaleTimeString()}`);
  }
  
  // Note: For Electron/Node.js, you would add file system save here
  // Example:
  // if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
  //   const fs = require('fs');
  //   const path = require('path');
  //   const savePath = path.join(process.env.APPDATA || process.env.HOME, 'Foni', 'autosave.md');
  //   fs.writeFileSync(savePath, content);
  // }
}

/**
 * Load auto-saved content from localStorage
 */
export function loadAutoSave(format: 'markdown' | 'text' = 'markdown'): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    const key = `fonii-autosave-${format}`;
    return window.localStorage.getItem(key);
  }
  return null;
}

/**
 * Get auto-save timestamp
 */
export function getAutoSaveTimestamp(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('fonii-autosave-timestamp');
  }
  return null;
}

/**
 * Clear auto-saved content
 */
export function clearAutoSave(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('fonii-autosave-markdown');
    window.localStorage.removeItem('fonii-autosave-text');
    window.localStorage.removeItem('fonii-autosave-timestamp');
    lastSavedContent = '';
  }
}
