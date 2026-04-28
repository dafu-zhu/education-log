import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';

/**
 * Rendered after the user clicks the reset link in their email.
 * Supabase puts a recovery session on the URL hash; AuthProvider picks it up
 * via onAuthStateChange. The user then sets a new password here.
 */
export function ResetPasswordPage() {
  const { setNewPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await setNewPassword(password);
      window.location.hash = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">Set new password</h1>
        <hr className="login-rule" />
        <form onSubmit={onSubmit}>
          <label>
            new password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save password'}
          </button>
          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
