/**
 * Email service for sending notes
 * Uses mailto: links for simplicity
 */

/**
 * Send notes via email
 */
export function sendViaEmail(
  emailAddress: string,
  subject: string,
  content: string,
  format: 'markdown' | 'text' = 'markdown'
): void {
  const body = encodeURIComponent(content);
  const encodedSubject = encodeURIComponent(subject);
  const mailtoLink = `mailto:${emailAddress}?subject=${encodedSubject}&body=${body}`;
  
  window.location.href = mailtoLink;
}

/**
 * Generate email subject with timestamp
 */
export function generateEmailSubject(prefix: string = 'Voice Notes'): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('el-GR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeStr = now.toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${prefix} - ${dateStr} ${timeStr}`;
}
