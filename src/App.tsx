import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginPage } from './auth/LoginPage';
import { ResetPasswordPage } from './auth/ResetPasswordPage';
import { HomePage } from './pages/HomePage';

function useHashRoute(): string {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return hash;
}

function Router() {
  const { session, loading } = useAuth();
  const hash = useHashRoute();

  if (loading) return null;

  // Reset link from email lands at #/reset-password and Supabase places a
  // recovery session on the URL. Show the reset form even if we appear "signed in"
  // (the session at this moment is the recovery session, not a regular login).
  if (hash.startsWith('#/reset-password')) {
    return <ResetPasswordPage />;
  }

  return session ? <HomePage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
