/**
 * Google Drive integration service
 * Uploads markdown/text files to Google Drive
 */

const GOOGLE_DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any = null;
let gapiLoaded = false;
let gisLoaded = false;

/**
 * Load Google API scripts
 */
export async function loadGoogleApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gapiLoaded && gisLoaded) {
      resolve();
      return;
    }

    // Load gapi
    if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => {
        window.gapi.load('client', async () => {
          await window.gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          gapiLoaded = true;
          if (gisLoaded) resolve();
        });
      };
      gapiScript.onerror = reject;
      document.head.appendChild(gapiScript);
    } else {
      gapiLoaded = true;
    }

    // Load GIS
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = () => {
        gisLoaded = true;
        if (gapiLoaded) resolve();
      };
      gisScript.onerror = reject;
      document.head.appendChild(gisScript);
    } else {
      gisLoaded = true;
    }
  });
}

/**
 * Initialize OAuth token client
 */
export function initTokenClient(clientId: string): void {
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services not loaded');
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: GOOGLE_DRIVE_SCOPES,
    callback: () => {}, // Will be overridden
  });
}

/**
 * Authenticate with Google
 */
export async function authenticate(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized. Call initTokenClient first.'));
      return;
    }

    tokenClient.callback = (response: any) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(true);
      }
    };

    const token = window.gapi?.client?.getToken();
    if (token === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return window.gapi?.client?.getToken() !== null;
}

/**
 * Upload file to Google Drive
 */
export async function uploadToDrive(
  filename: string,
  content: string,
  mimeType: string = 'text/markdown',
  folderId?: string
): Promise<string> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated with Google');
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const metadata: any = {
    name: filename,
    mimeType: mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelim;

  const request = window.gapi.client.request({
    path: '/upload/drive/v3/files',
    method: 'POST',
    params: {
      uploadType: 'multipart',
    },
    headers: {
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body: multipartRequestBody,
  });

  const response = await request;
  return response.result.id;
}

/**
 * Update existing file in Google Drive
 */
export async function updateDriveFile(
  fileId: string,
  content: string,
  mimeType: string = 'text/markdown'
): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated with Google');
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelim;

  const request = window.gapi.client.request({
    path: `/upload/drive/v3/files/${fileId}`,
    method: 'PATCH',
    params: {
      uploadType: 'multipart',
    },
    headers: {
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body: multipartRequestBody,
  });

  await request;
}

/**
 * List files in a folder
 */
export async function listFilesInFolder(folderId: string): Promise<any[]> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated with Google');
  }

  const response = await window.gapi.client.drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, modifiedTime)',
    orderBy: 'modifiedTime desc',
  });

  return response.result.files || [];
}

/**
 * Create a folder in Google Drive
 */
export async function createFolder(name: string, parentId?: string): Promise<string> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated with Google');
  }

  const metadata: any = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  const request = window.gapi.client.drive.files.create({
    resource: metadata,
    fields: 'id',
  });

  const response = await request;
  return response.result.id;
}

/**
 * Sign out from Google
 */
export function signOut(): void {
  const token = window.gapi?.client?.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
}
