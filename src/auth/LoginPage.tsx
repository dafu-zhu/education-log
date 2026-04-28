import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { signIn, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'forgot'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await sendPasswordReset(email);
      setInfo('Check your email for a reset link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">Education Log</h1>
        <hr className="login-rule" />

        {mode === 'sign-in' ? (
          <form onSubmit={onSignIn}>
            <label>
              email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            {error && <p className="login-error">{error}</p>}
            <p className="login-link">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('forgot');
                  setError(null);
                  setInfo(null);
                }}
              >
                forgot password?
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={onForgot}>
            <label>
              email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            {error && <p className="login-error">{error}</p>}
            {info && <p className="login-info">{info}</p>}
            <p className="login-link">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('sign-in');
                  setError(null);
                  setInfo(null);
                }}
              >
                back to sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
