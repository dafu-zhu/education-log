import { useAuth } from '../auth/AuthProvider';

// Replaced in Phase J with the full HomePage assembly.
export function HomePage() {
  const { signOut } = useAuth();
  return (
    <div style={{ padding: 32 }}>
      <p>Logged in. (HomePage coming next.)</p>
      <button onClick={signOut}>Log out</button>
    </div>
  );
}
