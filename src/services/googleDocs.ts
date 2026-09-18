/**
 * Google Docs integration service
 * Uses the Google Docs API to append text to a document
 * Requires OAuth2 authentication via Google Identity Services
 */

// Google API types
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const GOOGLE_DOCS_SCOPES = 'https://www.googleapis.com/auth/documents';
const DISCOVERY_DOC = 'https://docs.googleapis.com/$discovery/rest?version=v1';

let gapiInited = false;
let gisInited = false;
let tokenClient: any = null;

export async function initGoogleApi(clientId: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Load GAPI script
    if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.onload = () => {
        window.gapi.load('client', async () => {
          await window.gapi.client.load(DISCOVERY_DOC);
          gapiInited = true;
          tryInitGIS(clientId);
          checkReady(resolve);
        });
      };
      document.head.appendChild(script1);
    } else {
      gapiInited = true;
      checkReady(resolve);
    }

    // Load GIS script
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script2 = document.createElement('script');
      script2.src = 'https://accounts.google.com/gsi/client';
      script2.onload = () => {
        gisInited = true;
        tryInitGIS(clientId);
        checkReady(resolve);
      };
      document.head.appendChild(script2);
    } else {
      gisInited = true;
      checkReady(resolve);
    }

    function checkReady(resolve: (value: boolean) => void) {
      if (gapiInited && gisInited) {
        resolve(true);
      }
    }
  });
}

function tryInitGIS(clientId: string) {
  if (gapiInited && gisInited && window.google?.accounts?.oauth2 && !tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DOCS_SCOPES,
      callback: () => {}, // Will be overridden per request
    });
  }
}

export async function authenticate(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google API not initialized. Make sure you have a valid Client ID.'));
      return;
    }

    tokenClient.callback = (response: any) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(true);
      }
    };

    // Check if we already have a token
    if (window.gapi?.client?.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

export async function appendToDoc(docId: string, text: string): Promise<void> {
  if (!window.gapi?.client?.docs) {
    throw new Error('Google Docs API not loaded');
  }

  try {
    // Get the document to find the end index
    const doc = await window.gapi.client.docs.documents.get({
      documentId: docId,
    });

    const content = doc.result.body?.content;
    if (!content) throw new Error('Could not read document');

    // Find the last index of the document body
    const lastIndex = content[content.length - 1].endIndex! - 1;

    // Append text with a timestamp header and newline
    const timestamp = new Date().toLocaleString('el-GR');
    const requests = [
      {
        insertText: {
          location: { index: lastIndex },
          text: `\n[${timestamp}]\n${text}\n`,
        },
      },
    ];

    await window.gapi.client.docs.documents.batchUpdate({
      documentId: docId,
      requests: requests,
    });
  } catch (error: any) {
    console.error('Error appending to doc:', error);
    throw new Error(error?.result?.error?.message || 'Failed to append to document');
  }
}

export async function createDoc(title: string): Promise<string> {
  if (!window.gapi?.client?.docs) {
    throw new Error('Google Docs API not loaded');
  }

  const response = await window.gapi.client.docs.documents.create({
    title: title,
  });

  return response.result.documentId;
}

export function isGoogleApiReady(): boolean {
  return gapiInited && gisInited;
}

export function hasValidToken(): boolean {
  return window.gapi?.client?.getToken() !== null;
}
