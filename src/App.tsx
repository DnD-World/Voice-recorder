import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS, TranscriptionSegment, TranscriptionProvider } from './types';
import { loadSettings, saveSettings, generateId, formatDuration } from './utils';
import { AudioCapture } from './services/audioCapture';
import { createProvider } from './services/transcription';
import type { TranscriptionProviderInterface } from './services/transcription';
import { exportNotes, toMarkdown } from './services/fileExport';
import { sendViaEmail, generateEmailSubject } from './services/email';
import { 
  loadGoogleApi, 
  initTokenClient, 
  authenticate as authenticateDrive, 
  isAuthenticated as isDriveAuthenticated,
  uploadToDrive,
  updateDriveFile,
  signOut as signOutDrive
} from './services/googleDrive';

type View = 'transcription' | 'settings';

function App() {
  const [view, setView] = useState<View>('transcription');
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = loadSettings();
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  });
  
  // Transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  
  // Google Drive state
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [driveSyncing, setDriveSyncing] = useState(false);
  
  // Refs
  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const providerRef = useRef<TranscriptionProviderInterface | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fullTextRef = useRef('');
  const driveFileIdRef = useRef<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments, interimText]);

  // Save settings when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const startRecording = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    setSegments([]);
    setInterimText('');
    fullTextRef.current = '';

    // Validate API key
    if (settings.provider === 'gemini' && !settings.geminiApiKey) {
      setError('Please add your Gemini API key in Settings');
      setIsConnecting(false);
      return;
    }
    if (settings.provider === 'groq' && !settings.groqApiKey) {
      setError('Please add your Groq API key in Settings');
      setIsConnecting(false);
      return;
    }
    if (settings.provider === 'voxtral' && !settings.mistralApiKey) {
      setError('Please add your Mistral API key in Settings');
      setIsConnecting(false);
      return;
    }

    try {
      // Create provider
      const provider = createProvider(settings.provider);
      providerRef.current = provider;

      // Start provider
      await provider.start(settings, {
        onInterim: (text) => {
          setInterimText(text);
        },
        onFinal: (text) => {
          const segment: TranscriptionSegment = {
            id: generateId(),
            text: text,
            timestamp: Date.now(),
            isFinal: true,
          };
          setSegments(prev => [...prev, segment]);
          setInterimText('');
          fullTextRef.current += (fullTextRef.current ? ' ' : '') + text;
        },
        onError: (err) => {
          setError(err);
        },
        onConnected: () => {
          setIsConnecting(false);
          setIsRecording(true);
        },
        onDisconnected: () => {
          setIsRecording(false);
          setIsConnecting(false);
        },
      });

      // Start audio capture (skip for browser provider which handles its own audio)
      if (settings.provider !== 'browser') {
        const audioCapture = new AudioCapture();
        audioCaptureRef.current = audioCapture;
        
        await audioCapture.start((chunk) => {
          provider.sendAudio(chunk);
        });
      }

      // Start session timer
      setSessionDuration(0);
      sessionTimerRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);

      // Start auto-save timer
      if (settings.autoSaveInterval > 0) {
        saveTimerRef.current = setInterval(() => {
          // Auto-save to local server
          if (fullTextRef.current.trim()) {
            const content = toMarkdown(segments, 'Voice Notes');
            
            // Save to local server
            fetch('/api/autosave', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content, format: 'markdown' })
            })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                console.log(`💾 Auto-saved: ${data.filename}`);
              }
            })
            .catch(err => console.error('Auto-save error:', err));
          }
          
          // Sync to Google Drive if enabled
          if (driveConnected && fullTextRef.current.trim()) {
            const content = toMarkdown(segments, 'Voice Notes');
            const filename = `voice-notes-${new Date().toISOString().slice(0, 10)}.md`;
            
            if (driveFileIdRef.current) {
              updateDriveFile(driveFileIdRef.current, content).catch(console.error);
            } else if (settings.googleDriveFolderId) {
              uploadToDrive(filename, content, 'text/markdown', settings.googleDriveFolderId)
                .then(fileId => {
                  driveFileIdRef.current = fileId;
                  setDriveFileId(fileId);
                })
                .catch(console.error);
            } else {
              uploadToDrive(filename, content, 'text/markdown')
                .then(fileId => {
                  driveFileIdRef.current = fileId;
                  setDriveFileId(fileId);
                })
                .catch(console.error);
            }
          }
          
          setLastSaveTime(Date.now());
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }, settings.autoSaveInterval * 1000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsConnecting(false);
    }
  }, [settings]);

  const stopRecording = useCallback(async () => {
    // Stop audio capture
    if (audioCaptureRef.current) {
      audioCaptureRef.current.stop();
      audioCaptureRef.current = null;
    }

    // Stop provider
    if (providerRef.current) {
      await providerRef.current.stop();
      providerRef.current = null;
    }

    // Clear timers
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setIsRecording(false);
    setIsConnecting(false);
    setInterimText('');
  }, []);

  const clearTranscription = useCallback(() => {
    setSegments([]);
    setInterimText('');
    fullTextRef.current = '';
  }, []);

  const getFullText = useCallback(() => {
    return segments.map(s => s.text).join('\n');
  }, [segments]);

  const copyToClipboard = useCallback(() => {
    const text = getFullText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [getFullText]);

  const downloadAsMarkdown = useCallback(() => {
    exportNotes(segments, 'markdown', 'Voice Notes');
  }, [segments]);

  const downloadAsText = useCallback(() => {
    exportNotes(segments, 'text');
  }, [segments]);

  // Google Drive functions
  const connectGoogleDrive = useCallback(async () => {
    if (!settings.googleOAuthClientId) {
      setError('Please add your Google OAuth Client ID in Settings');
      return;
    }
    
    try {
      await loadGoogleApi();
      initTokenClient(settings.googleOAuthClientId);
      await authenticateDrive();
      setDriveConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Google Drive');
    }
  }, [settings.googleOAuthClientId]);

  const disconnectGoogleDrive = useCallback(() => {
    signOutDrive();
    setDriveConnected(false);
    setDriveFileId(null);
    driveFileIdRef.current = null;
  }, []);

  const syncToDrive = useCallback(async () => {
    if (!driveConnected || segments.length === 0) return;
    
    setDriveSyncing(true);
    try {
      const content = toMarkdown(segments, 'Voice Notes');
      const filename = `voice-notes-${new Date().toISOString().slice(0, 10)}.md`;
      
      if (driveFileIdRef.current) {
        // Update existing file
        await updateDriveFile(driveFileIdRef.current, content);
      } else if (settings.googleDriveFolderId) {
        // Upload to specified folder
        const fileId = await uploadToDrive(filename, content, 'text/markdown', settings.googleDriveFolderId);
        driveFileIdRef.current = fileId;
        setDriveFileId(fileId);
      } else {
        // Upload to root
        const fileId = await uploadToDrive(filename, content, 'text/markdown');
        driveFileIdRef.current = fileId;
        setDriveFileId(fileId);
      }
      
      setLastSaveTime(Date.now());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync to Google Drive');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setDriveSyncing(false);
    }
  }, [driveConnected, segments, settings.googleDriveFolderId]);

  const emailNotes = useCallback(() => {
    if (!settings.emailAddress || segments.length === 0) return;
    
    const content = toMarkdown(segments, 'Voice Notes');
    const subject = generateEmailSubject('Voice Notes');
    sendViaEmail(settings.emailAddress, subject, content, 'markdown');
  }, [segments, settings.emailAddress]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f]">
      {view === 'transcription' ? (
        <TranscriptionView
          isRecording={isRecording}
          isConnecting={isConnecting}
          interimText={interimText}
          segments={segments}
          error={error}
          sessionDuration={sessionDuration}
          lastSaveTime={lastSaveTime}
          saveStatus={saveStatus}
          copied={copied}
          provider={settings.provider}
          scrollRef={scrollRef}
          driveConnected={driveConnected}
          driveSyncing={driveSyncing}
          settings={settings}
          onStart={startRecording}
          onStop={stopRecording}
          onClear={clearTranscription}
          onCopy={copyToClipboard}
          onDownloadMd={downloadAsMarkdown}
          onDownloadTxt={downloadAsText}
          onEmail={emailNotes}
          onSyncDrive={syncToDrive}
          onOpenSettings={() => setView('settings')}
        />
      ) : (
        <SettingsView
          settings={settings}
          onUpdate={updateSettings}
          onBack={() => setView('transcription')}
        />
      )}
    </div>
  );
}

// ============ TRANSCRIPTION VIEW ============

interface TranscriptionViewProps {
  isRecording: boolean;
  isConnecting: boolean;
  interimText: string;
  segments: TranscriptionSegment[];
  error: string | null;
  sessionDuration: number;
  lastSaveTime: number | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  copied: boolean;
  provider: TranscriptionProvider;
  scrollRef: React.RefObject<HTMLDivElement>;
  driveConnected: boolean;
  driveSyncing: boolean;
  settings: AppSettings;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onCopy: () => void;
  onDownloadMd: () => void;
  onDownloadTxt: () => void;
  onEmail: () => void;
  onSyncDrive: () => void;
  onOpenSettings: () => void;
}

function TranscriptionView({
  isRecording,
  isConnecting,
  interimText,
  segments,
  error,
  sessionDuration,
  saveStatus,
  copied,
  provider,
  scrollRef,
  driveConnected,
  driveSyncing,
  settings,
  onStart,
  onStop,
  onClear,
  onCopy,
  onDownloadMd,
  onDownloadTxt,
  onEmail,
  onSyncDrive,
  onOpenSettings,
}: TranscriptionViewProps) {
  const hasContent = segments.length > 0;

  return (
    <div className="flex flex-col h-full safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#252525] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">Φωνή</span>
          <span className="text-[10px] text-[#555] font-medium uppercase tracking-widest hidden sm:inline">voice notes</span>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#ef4444]/10 rounded-full">
              <div className="w-2 h-2 bg-[#ef4444] rounded-full recording-pulse" />
              <span className="text-xs text-[#ef4444] font-mono font-medium">
                {formatDuration(sessionDuration)}
              </span>
            </div>
          )}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:bg-[#252525] transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Provider indicator */}
      <div className="px-4 py-2 flex items-center justify-between shrink-0">
        <span className="text-[11px] text-[#6366f1] font-medium tracking-wide">
          {provider === 'gemini' && '◆ Gemini Transcribe Live'}
          {provider === 'groq' && '◆ Whisper Large V3'}
          {provider === 'voxtral' && '◆ Voxtral Mini Realtime'}
          {provider === 'browser' && '◆ Browser Recognition'}
        </span>
        {saveStatus === 'saved' && (
          <span className="text-[11px] text-[#22c55e] font-medium">
            ✓ checkpoint
          </span>
        )}
      </div>

      {/* Transcription area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        {!hasContent && !interimText && !isRecording && !isConnecting && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-5xl mb-5 opacity-80">📝</div>
            <h2 className="text-lg font-medium text-[#f5f5f5] mb-2">Your voice notes</h2>
            <p className="text-sm text-[#666] max-w-[280px] leading-relaxed">
              Tap the microphone to start transcribing your speech in Greek. Your text appears here in real time.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[11px] text-[#555]">
              <span className="px-2 py-1 bg-[#1a1a1a] rounded">el-GR</span>
              <span>Greek</span>
            </div>
          </div>
        )}

        {isConnecting && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[#a0a0a0]">Connecting to {provider}...</span>
            </div>
          </div>
        )}

        {/* Finalized segments */}
        <div className="space-y-1">
          {segments.map((segment, idx) => (
            <p key={segment.id} className="text-fade-in text-[15px] leading-[1.7] text-[#e5e5e5]">
              {idx > 0 && <span className="text-[#333] mr-1">·</span>}
              {segment.text}
            </p>
          ))}
        </div>

        {/* Interim text */}
        {interimText && (
          <p className="text-[15px] leading-[1.7] text-[#6366f1]/70 mt-1">
            {interimText}
            <span className="inline-block w-0.5 h-4 bg-[#6366f1] ml-0.5 animate-pulse align-middle" />
          </p>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg shrink-0">
          <p className="text-sm text-[#ef4444]">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="border-t border-[#252525] shrink-0 safe-bottom">
        {/* Action buttons */}
        {hasContent && !isRecording && (
          <div className="flex items-center justify-center gap-2 px-4 pt-3 pb-1 flex-wrap">
            <button
              onClick={onCopy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors border border-[#252525]"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
            <button
              onClick={onDownloadMd}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors border border-[#252525]"
            >
              📝 .md
            </button>
            <button
              onClick={onDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors border border-[#252525]"
            >
              📄 .txt
            </button>
            {settings.emailEnabled && settings.emailAddress && (
              <button
                onClick={onEmail}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors border border-[#252525]"
              >
                ✉️ Email
              </button>
            )}
            {driveConnected && (
              <button
                onClick={onSyncDrive}
                disabled={driveSyncing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors border border-[#252525] disabled:opacity-50"
              >
                {driveSyncing ? '⏳ Syncing...' : '☁️ Drive'}
              </button>
            )}
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors border border-[#252525]"
            >
              🗑️ Clear
            </button>
          </div>
        )}

        {/* Recording button */}
        <div className="flex items-center justify-center py-5">
          <button
            onClick={isRecording ? onStop : onStart}
            disabled={isConnecting}
            className={`relative w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isRecording
                ? 'bg-[#ef4444] hover:bg-[#dc2626] shadow-lg shadow-[#ef4444]/20'
                : isConnecting
                ? 'bg-[#252525] cursor-not-allowed'
                : 'bg-[#6366f1] hover:bg-[#7c7ff7] shadow-lg shadow-[#6366f1]/20'
            }`}
          >
            {isRecording && (
              <div className="absolute inset-[-4px] rounded-full border-2 border-[#ef4444]/30 recording-ring" />
            )}
            {isRecording ? (
              <div className="w-5 h-5 bg-white rounded-[3px] recording-pulse" />
            ) : (
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Status text */}
        <p className="text-center text-[11px] text-[#555] pb-4 -mt-2">
          {isConnecting && 'Establishing connection...'}
          {isRecording && 'Tap to stop recording'}
          {!isRecording && !isConnecting && 'Tap to start'}
        </p>
      </div>
    </div>
  );
}

// ============ SETTINGS VIEW ============

interface SettingsViewProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onBack: () => void;
}

function SettingsView({ settings, onUpdate, onBack }: SettingsViewProps) {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[#252525] shrink-0">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-[#252525] transition-colors"
        >
          <svg className="w-5 h-5 text-[#f5f5f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-7">
        {/* Provider Selection */}
        <section>
          <h2 className="text-[11px] font-semibold text-[#666] uppercase tracking-widest mb-3">
            Transcription Engine
          </h2>
          <div className="space-y-2">
            {(['gemini', 'groq', 'voxtral', 'browser'] as TranscriptionProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => onUpdate({ provider: p })}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  settings.provider === p
                    ? 'border-[#6366f1]/50 bg-[#6366f1]/5'
                    : 'border-[#222] hover:border-[#333] bg-[#141414]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                    settings.provider === p ? 'border-[#6366f1]' : 'border-[#333]'
                  }`}>
                    {settings.provider === p && (
                      <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${
                      settings.provider === p ? 'text-[#f5f5f5]' : 'text-[#ccc]'
                    }`}>
                      {p === 'gemini' && 'Gemini 3.5 Transcribe Live'}
                      {p === 'groq' && 'Whisper Large V3 (Groq)'}
                      {p === 'voxtral' && 'Voxtral Mini Realtime'}
                      {p === 'browser' && 'Browser Speech Recognition'}
                    </p>
                    <p className="text-xs text-[#666] mt-0.5 leading-relaxed">
                      {p === 'gemini' && 'Best quality for Greek. Real-time WebSocket streaming. Smart mode available.'}
                      {p === 'groq' && 'Fast multilingual. Sends audio in ~3s chunks. Great accuracy.'}
                      {p === 'voxtral' && 'Sub-200ms latency. 13 languages. Very responsive.'}
                      {p === 'browser' && 'No API key needed. Works offline. Quality varies for Greek.'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* API Keys */}
        <section>
          <h2 className="text-[11px] font-semibold text-[#666] uppercase tracking-widest mb-3">
            API Key
          </h2>
          <div className="space-y-3">
            {settings.provider !== 'browser' ? (
              <ApiKeyInput
                label={
                  settings.provider === 'gemini' ? 'Google AI API Key' :
                  settings.provider === 'groq' ? 'Groq API Key' :
                  'Mistral API Key'
                }
                value={
                  settings.provider === 'gemini' ? settings.geminiApiKey :
                  settings.provider === 'groq' ? settings.groqApiKey :
                  settings.mistralApiKey
                }
                onChange={(val) => {
                  if (settings.provider === 'gemini') onUpdate({ geminiApiKey: val });
                  else if (settings.provider === 'groq') onUpdate({ groqApiKey: val });
                  else onUpdate({ mistralApiKey: val });
                }}
                showKey={showKeys['apiKey'] || false}
                onToggle={() => toggleKeyVisibility('apiKey')}
                placeholder={
                  settings.provider === 'gemini' ? 'AIza...' :
                  settings.provider === 'groq' ? 'gsk_...' :
                  ''
                }
                helpUrl={
                  settings.provider === 'gemini' ? 'https://aistudio.google.com/apikey' :
                  settings.provider === 'groq' ? 'https://console.groq.com/keys' :
                  'https://console.mistral.ai/api-keys/'
                }
              />
            ) : (
              <div className="p-3 bg-[#141414] border border-[#222] rounded-xl">
                <p className="text-sm text-[#888]">
                  No API key needed. Uses your browser's built-in speech recognition.
                </p>
                <p className="text-xs text-[#555] mt-1">
                  Works best in Chrome or Edge. Quality for Greek may vary.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Language */}
        <section>
          <h2 className="text-[11px] font-semibold text-[#666] uppercase tracking-widest mb-3">
            Language
          </h2>
          <select
            value={settings.language}
            onChange={(e) => onUpdate({ language: e.target.value })}
            className="w-full p-3.5 bg-[#141414] border border-[#222] rounded-xl text-sm text-[#f5f5f5] focus:border-[#6366f1] focus:outline-none appearance-none"
          >
            <option value="el-GR">🇬🇷 Ελληνικά (Greek)</option>
            <option value="en-US">🇺🇸 English (US)</option>
            <option value="en-GB">🇬🇧 English (UK)</option>
            <option value="de-DE">🇩🇪 Deutsch</option>
            <option value="fr-FR">🇫🇷 Français</option>
            <option value="it-IT">🇮🇹 Italiano</option>
            <option value="es-ES">🇪🇸 Español</option>
            <option value="">🌐 Auto-detect</option>
          </select>
        </section>

        {/* Transcription Mode (Gemini only) */}
        {settings.provider === 'gemini' && (
          <section>
            <h2 className="text-[11px] font-semibold text-[#666] uppercase tracking-widest mb-3">
              Transcription Mode
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate({ smartTranscription: false })}
                className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                  !settings.smartTranscription
                    ? 'border-[#6366f1]/50 bg-[#6366f1]/5 text-[#f5f5f5]'
                    : 'border-[#222] text-[#666] hover:border-[#333]'
                }`}
              >
                Verbatim
              </button>
              <button
                onClick={() => onUpdate({ smartTranscription: true })}
                className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                  settings.smartTranscription
                    ? 'border-[#6366f1]/50 bg-[#6366f1]/5 text-[#f5f5f5]'
                    : 'border-[#222] text-[#666] hover:border-[#333]'
                }`}
              >
                Smart ✨
              </button>
            </div>
            <p className="text-xs text-[#555] mt-2 leading-relaxed">
              {settings.smartTranscription
                ? 'Smart: removes filler words, fixes punctuation, formats text.'
                : 'Verbatim: captures everything exactly as spoken, including pauses and repetitions.'}
            </p>
          </section>
        )}

        {/* Auto-save interval */}
        <section>
          <h2 className="text-[11px] font-semibold text-[#666] uppercase tracking-widest mb-3">
            Checkpoint Interval
          </h2>
          <select
            value={settings.autoSaveInterval}
            onChange={(e) => onUpdate({ autoSaveInterval: Number(e.target.value) })}
            className="w-full p-3.5 bg-[#141414] border border-[#222] rounded-xl text-sm text-[#f5f5f5] focus:border-[#6366f1] focus:outline-none appearance-none"
          >
            <option value={30}>Every 30 seconds</option>
            <option value={60}>Every 1 minute</option>
            <option value={120}>Every 2 minutes</option>
            <option value={300}>Every 5 minutes</option>
          </select>
          <p className="text-xs text-[#555] mt-2">
            Text is checkpointed at this interval. Use Download to save your notes.
          </p>
        </section>

        {/* Email Settings */}
        <section>
          <h2 className="text-[11px] font-semibold text-[#666] uppercase tracking-widest mb-3">
            Email Notes
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => onUpdate({ emailEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-[#252525] bg-[#1a1a1a] text-[#6366f1] focus:ring-[#6366f1]"
              />
              <span className="text-sm text-[#ccc]">Enable email export</span>
            </label>

            {settings.emailEnabled && (
              <div>
                <label className="text-xs text-[#888] mb-1.5 block font-medium">Email Address</label>
                <input
                  type="email"
                  value={settings.emailAddress}
                  onChange={(e) => onUpdate({ emailAddress: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full p-3.5 bg-[#141414] border border-[#222] rounded-xl text-sm text-[#f5f5f5] focus:border-[#6366f1] focus:outline-none placeholder:text-[#444]"
                />
                <p className="text-xs text-[#555] mt-2">
                  Notes will be sent as markdown attachments to this email address.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Google Drive Settings */}
        <section>
          <h2 className="text-[11px] font-semibold text-[#666] uppercase tracking-widest mb-3">
            Google Drive Backup
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.googleDriveEnabled}
                onChange={(e) => onUpdate({ googleDriveEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-[#252525] bg-[#1a1a1a] text-[#6366f1] focus:ring-[#6366f1]"
              />
              <span className="text-sm text-[#ccc]">Enable Google Drive sync</span>
            </label>

            {settings.googleDriveEnabled && (
              <>
                <div>
                  <label className="text-xs text-[#888] mb-1.5 block font-medium">
                    Google OAuth Client ID
                  </label>
                  <input
                    type="text"
                    value={settings.googleOAuthClientId}
                    onChange={(e) => onUpdate({ googleOAuthClientId: e.target.value })}
                    placeholder="xxxxx.apps.googleusercontent.com"
                    className="w-full p-3.5 bg-[#141414] border border-[#222] rounded-xl text-sm text-[#f5f5f5] focus:border-[#6366f1] focus:outline-none placeholder:text-[#444] font-mono text-xs"
                  />
                  <p className="text-xs text-[#555] mt-2">
                    Get this from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID
                  </p>
                </div>

                <div>
                  <label className="text-xs text-[#888] mb-1.5 block font-medium">
                    Google Drive Folder ID (optional)
                  </label>
                  <input
                    type="text"
                    value={settings.googleDriveFolderId}
                    onChange={(e) => onUpdate({ googleDriveFolderId: e.target.value })}
                    placeholder="Leave empty for root folder"
                    className="w-full p-3.5 bg-[#141414] border border-[#222] rounded-xl text-sm text-[#f5f5f5] focus:border-[#6366f1] focus:outline-none placeholder:text-[#444] font-mono text-xs"
                  />
                  <p className="text-xs text-[#555] mt-2">
                    Find folder ID in the URL: drive.google.com/drive/folders/<span className="text-[#6366f1]">THIS_PART</span>
                  </p>
                </div>

                <div className="p-3 bg-[#141414] border border-[#222] rounded-xl">
                  <p className="text-xs text-[#666] leading-relaxed">
                    <strong className="text-[#888]">Setup Required:</strong> To enable Google Drive sync, you need to:
                  </p>
                  <ol className="text-xs text-[#555] mt-2 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Create a Google Cloud Project</li>
                    <li>Enable Google Drive API</li>
                    <li>Create OAuth 2.0 credentials (Web application)</li>
                    <li>Add your domain to authorized JavaScript origins</li>
                    <li>Paste the Client ID above</li>
                  </ol>
                  <p className="text-xs text-[#555] mt-2">
                    <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#6366f1] hover:underline">
                      Open Google Cloud Console →
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Tips */}
        <section className="pb-8">
          <div className="p-4 bg-[#141414] border border-[#222] rounded-xl">
            <h3 className="text-sm font-medium text-[#ccc] mb-2">💡 Tips for Greek</h3>
            <ul className="text-xs text-[#666] space-y-1.5 leading-relaxed">
              <li>• <strong className="text-[#888]">Gemini</strong> has the best Greek support with live streaming</li>
              <li>• <strong className="text-[#888]">Whisper V3</strong> supports 99+ languages including Greek</li>
              <li>• <strong className="text-[#888]">Voxtral</strong> handles 13 European languages well</li>
              <li>• Speak clearly at a moderate pace for best results</li>
              <li>• Use Download to export your notes as a text file</li>
              <li>• Copy text to paste into Google Docs, Notion, etc.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

// ============ API KEY INPUT COMPONENT ============

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showKey: boolean;
  onToggle: () => void;
  placeholder: string;
  helpUrl?: string;
}

function ApiKeyInput({ label, value, onChange, showKey, onToggle, placeholder, helpUrl }: ApiKeyInputProps) {
  return (
    <div>
      <label className="text-xs text-[#888] mb-1.5 block font-medium">{label}</label>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3.5 pr-11 bg-[#141414] border border-[#222] rounded-xl text-sm text-[#f5f5f5] focus:border-[#6366f1] focus:outline-none placeholder:text-[#444] font-mono"
        />
        <button
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
        >
          {showKey ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {helpUrl && (
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#6366f1] mt-1.5 inline-block hover:underline"
        >
          Get API key →
        </a>
      )}
    </div>
  );
}

export default App;
