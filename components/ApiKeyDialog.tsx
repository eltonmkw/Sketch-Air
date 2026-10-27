import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { clearApiKey, storeApiKey } from '../services/apiKeyStorage';
import { testApiKey } from '../services/geminiService';

interface Props {
  open: boolean;
  hasKey: boolean;
  savedKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function ApiKeyDialog({ open, hasKey, savedKey, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const keyInput = useRef<HTMLInputElement>(null);
  const [keyError, setKeyError] = useState('');
  const [key, setKey] = useState('');
  const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState('');
  const [storageFallback, setStorageFallback] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const indicator = {
    idle: { color: '#64748b', label: 'Not tested' },
    testing: { color: '#eab308', label: 'Checking connection' },
    success: { color: '#15803d', label: 'Connected' },
    error: { color: '#dc2626', label: 'Connection failed' },
  }[testStatus];
  const testVersion = useRef(0);


  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
    setKey('');
    setRemember(false);
    setNotice('');
    setStorageFallback(false);
    setKeyError('');
    setTestResult('');
    setTestStatus('idle');
    setTesting(false);
    testVersion.current += 1;
    return () => {
      testVersion.current += 1;

    };
  }, [open]);

  const handleTest = async () => {
    const value = key.trim() || savedKey;
    if (!value || testing) return;
    const version = ++testVersion.current;
    setTesting(true);
    setKeyError('');
    setTestStatus('testing');
    setTestResult('Testing connection…');
    try {
      await testApiKey(value);
      if (version === testVersion.current) {
        setTestStatus('success');
        setTestResult('Connection successful. Click Done to use this key.');
      }
    } catch (error) {
      if (version === testVersion.current) {
        setTestStatus('error');
        setTestResult('');
        setKeyError((error as Error).message);
        keyInput.current?.focus();
      }
    } finally {
      if (version === testVersion.current) setTesting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (testStatus !== 'success') {
      void handleTest();
      return;
    }
    if (storageFallback) {
      onClose();
      return;
    }
    const value = key.trim() || savedKey;
    const stored = storeApiKey(value, remember);
    onSave(value);
    if (stored === 'write-failed' || stored === 'removal-failed') {
      setStorageFallback(true);
      setNotice(stored === 'removal-failed'
        ? 'Your active key is in memory, but previously saved key data could not be cleared. A previously saved key may return after refresh. Clear this site’s browser data to remove it. Click Done to continue.'
        : 'Browser storage is blocked. Your key works until refresh. Click Done to continue.');
      return;
    }
    onClose();
  };

  return (
    <dialog ref={dialog} aria-labelledby="api-key-title" aria-describedby="api-key-description"
      onCancel={onClose} onClose={onClose}
      style={{ width: 'min(440px, calc(100% - 32px))', padding: 24, border: '1px solid #cbd5e1', borderRadius: 12, margin: 'auto', color: '#1e293b' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
          <h1 id="api-key-title" style={{ fontSize: 22, fontWeight: 600, flex: 1 }}>Bring Your Own AI API Key</h1>
          <button type="button" onClick={onClose} aria-label="Close API key dialog" title="Close"
            className="hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, flexShrink: 0, borderRadius: 4 }}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p id="api-key-description" style={{ marginBottom: 16 }}>Enter your Gemini API key to bring your sketches to life.</p>
        <input ref={keyInput} id="gemini-key" type="password" disabled={testing || testStatus === 'success'} required={!savedKey} autoComplete="off" spellCheck={false}
          aria-label="Gemini API key" aria-invalid={Boolean(keyError)} aria-describedby={keyError ? 'gemini-key-error' : undefined}
          value={key} placeholder={hasKey ? 'Enter a replacement key, or test your saved key' : ''} onChange={event => {
            setKey(event.target.value);
            setKeyError('');
            testVersion.current += 1;
            setTesting(false);
            setTestResult('');
            setTestStatus('idle');
          }}
          style={{ display: 'block', width: '100%', padding: 10, border: `1px solid ${keyError ? '#dc2626' : '#94a3b8'}`, borderRadius: 4, margin: '6px 0 12px' }} />
        {keyError && <p id="gemini-key-error" role="alert" style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>{keyError}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="submit" disabled={testing || !(key.trim() || savedKey)}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          style={{ background: testStatus === 'success' ? '#1d4ed8' : 'white', color: testStatus === 'success' ? 'white' : '#1e293b', padding: '8px 12px', border: '1px solid #94a3b8', borderRadius: 4, opacity: testing || !(key.trim() || savedKey) ? 0.6 : 1 }}>
          {testing ? 'Testing…' : testStatus === 'success' ? 'Done' : 'Test Connection'}
        </button>
        <span role="status" aria-atomic="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: indicator.color, border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />
          {indicator.label}
        </span>
        </div>
        {testResult && <p role="status" style={{ fontSize: 13, marginBottom: 12 }}>{testResult}</p>}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" disabled={testing} checked={remember} onChange={event => {
            setRemember(event.target.checked);
            setStorageFallback(false);
            setNotice('');
          }} />
          Remember on this device
        </label>
        <p style={{ fontSize: 13, margin: '12px 0' }}>By selecting 'Remember on this device', you save your key in this browser for 30 days or until removed. Otherwise, it clears on refresh. Browser storage isn’t a secure vault.</p>
        <p style={{ fontSize: 13, marginBottom: 16 }}>Your key and sketch go directly to Google; charges may apply. Connection success doesn’t guarantee generation quota or billing access. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Get a Gemini API key</a>.</p>
        {notice && <p role="status" style={{ marginBottom: 12 }}>{notice}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {hasKey && savedKey.trim() && <button type="button" onClick={() => {
      
            const cleared = clearApiKey();
            onSave('');
            setKey('');
            setKeyError('');
            testVersion.current += 1;
            setTesting(false);
            setTestResult('');
            setTestStatus('idle');
            setStorageFallback(false);
            setNotice(cleared
              ? 'API key removed. You can continue drawing.'
              : 'The active key was cleared, but we could not remove the saved browser data. A saved key may return after refresh. Clear this site’s browser data to remove it.');
          }}>Remove saved key</button>}
        </div>
      </form>
    </dialog>
  );
}
