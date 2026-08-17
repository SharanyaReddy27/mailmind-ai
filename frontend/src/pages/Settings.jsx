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
  const [errorStatus, setErrorStatus] = useState(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const navigate = useNavigate();

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getGmailStatus();
      setStatus(res);
      setNeedsReconnect(Boolean(res?.needsReconnect));
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
    setNextPageToken(null);
    try {
      const res = await syncGmail(20);
      setSyncResult(res);
      if (res.nextPageToken) {
        setNextPageToken(res.nextPageToken);
      }
      // notify inbox to refresh
      window.dispatchEvent(new CustomEvent('mailmind:sync'));
      // refresh status
      loadStatus();
    } catch (err) {
      const message = err?.message || 'Sync failed';
      setError(message);
      setErrorStatus(err?.status || null);
      setNeedsReconnect(err?.status === 401 || message.toLowerCase().includes('reconnect'));
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken) return;
    setSyncing(true);
    setError('');
    try {
      const res = await syncGmail(20, nextPageToken);
      setSyncResult(prev => ({
        ...prev,
        message: 'More emails loaded',
        fetched: (prev?.fetched || 0) + res.fetched,
        created: (prev?.created || 0) + res.created,
        skipped: (prev?.skipped || 0) + res.skipped,
        failed: (prev?.failed || 0) + res.failed,
      }));
      if (res.nextPageToken) {
        setNextPageToken(res.nextPageToken);
      } else {
        setNextPageToken(null);
      }
      // notify inbox to refresh
      window.dispatchEvent(new CustomEvent('mailmind:sync'));
    } catch (err) {
      const message = err?.message || 'Failed to load more emails';
      setError(message);
      setErrorStatus(err?.status || null);
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
                <span>Connected as {status.googleEmail || 'your Gmail account'}</span>
              </div>
              <p className="integration-detail">Status: Connected</p>
              <p className="integration-detail">Connected at: {status.connectedAt || '—'}</p>
              <p className="integration-detail">Last synced: {status.lastSyncedAt || '—'}</p>

              {(status.hasRefreshToken === false || needsReconnect) && (
                <p className="integration-detail warning">
                  Your Gmail permission needs to be renewed. Reconnect Gmail.
                </p>
              )}

              <div className="integration-actions">
                <button type="button" disabled={syncing} onClick={handleSync} className="primary">
                  <RefreshCw size={14} strokeWidth={2.25} />
                  {syncing ? 'Syncing…' : 'Sync Emails'}
                </button>
                <button type="button" onClick={() => navigate('/inbox')}>Open Inbox</button>
                <button type="button" onClick={handleDisconnect} className="danger">Disconnect Gmail</button>
                {(status.hasRefreshToken === false || needsReconnect) && (
                  <button type="button" onClick={handleConnect} className="primary">
                    Reconnect Gmail
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p>{status?.needsReconnect ? 'Your Gmail permission needs to be renewed. Reconnect Gmail.' : 'Not connected.'}</p>
              <div className="integration-actions">
                <button type="button" onClick={handleConnect} className="primary">
                  {status?.needsReconnect ? 'Reconnect Gmail' : 'Connect Gmail'}
                </button>
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
              {nextPageToken && (
                <button type="button" disabled={syncing} onClick={handleLoadMore} className="secondary" style={{ marginTop: '10px' }}>
                  <RefreshCw size={14} strokeWidth={2.25} />
                  {syncing ? 'Loading more…' : 'Load More Emails'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
