import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGmailAuthUrl, getGmailStatus, syncGmail, disconnectGmail } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Mail, RefreshCw } from 'lucide-react';

function Settings() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const navigate = useNavigate();

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getGmailStatus();
      setStatus(res);
    } catch (err) {
      setError(err.message || 'Unable to load Gmail status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    // check query param for oauth result
    const params = new URLSearchParams(window.location.search);
    const gmail = params.get('gmail');
    if (gmail) {
      if (gmail === 'connected') {
        setSyncResult({ success: true, message: 'Gmail connected' });
      } else if (gmail === 'error') {
        setError('Failed to connect Gmail. Please try again.');
      }

      // remove param without reload
      params.delete('gmail');
      const url = new URL(window.location.href);
      url.search = params.toString();
      window.history.replaceState({}, '', url.toString());
    }

    loadStatus();
  }, [currentUser]);

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getGmailAuthUrl();
      if (res && res.authUrl) {
        window.location.assign(res.authUrl);
      } else {
        setError('Invalid authorization URL');
      }
    } catch (err) {
      setError(err.message || 'Unable to request authorization');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setSyncResult(null);
    try {
      const res = await syncGmail(20);
      setSyncResult(res);
      // notify inbox to refresh
      window.dispatchEvent(new CustomEvent('mailmind:sync'));
      // refresh status
      loadStatus();
    } catch (err) {
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    const ok = window.confirm('Disconnect Gmail? Previously synced messages will remain.');
    if (!ok) return;
    setLoading(true);
    setError('');
    try {
      const res = await disconnectGmail();
      setStatus({ success: true, connected: false });
      setSyncResult(res);
    } catch (err) {
      setError(err.message || 'Unable to disconnect');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Integrations</h1>
          <p>Connect third-party services to enhance MailMind.</p>
        </div>
      </div>

      <div className="integration-card">
        <div className="integration-card-left">
          <div className="integration-icon">
            <Mail size={20} strokeWidth={2} />
          </div>
          <div>
            <h3>Gmail</h3>
            <p>Sync recent emails from your Gmail account (read-only).</p>
          </div>
        </div>

        <div className="integration-card-right">
          {loading && <LoadingSpinner label="Checking connection..." />}
          {error && <ErrorMessage title="Gmail" message={error} />}

          {!loading && status && status.connected ? (
            <div>
              <div className="integration-status-line">
                <CheckCircle2 size={15} strokeWidth={2.25} className="integration-status-icon" />
                <span>Connected as {status.googleEmail}</span>
              </div>
              <p className="integration-detail">Connected at: {status.connectedAt || '—'}</p>
              <p className="integration-detail">Last synced: {status.lastSyncedAt || '—'}</p>

              <div className="integration-actions">
                <button type="button" disabled={syncing} onClick={handleSync} className="primary">
                  <RefreshCw size={14} strokeWidth={2.25} />
                  {syncing ? 'Syncing…' : 'Sync Emails'}
                </button>
                <button type="button" onClick={() => navigate('/inbox')}>Open Inbox</button>
                <button type="button" onClick={handleDisconnect} className="danger">Disconnect Gmail</button>
              </div>
            </div>
          ) : (
            <div>
              <p>Not connected.</p>
              <div className="integration-actions">
                <button type="button" onClick={handleConnect} className="primary">Connect Gmail</button>
              </div>
            </div>
          )}

          {syncResult && (
            <div className="sync-result">
              <p>{syncResult.message}</p>
              <div className="sync-result-grid">
                <span>Fetched <strong>{syncResult.fetched}</strong></span>
                <span>Created <strong>{syncResult.created}</strong></span>
                <span>Skipped <strong>{syncResult.skipped}</strong></span>
                <span>Failed <strong>{syncResult.failed}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
