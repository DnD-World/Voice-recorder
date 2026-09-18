export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
}

export function loadSettings(): any {
  try {
    const stored = localStorage.getItem('fonii-settings');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return null;
}

export function saveSettings(settings: any): void {
  try {
    localStorage.setItem('fonii-settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
