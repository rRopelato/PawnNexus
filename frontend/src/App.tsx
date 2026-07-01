import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { api, getToken } from './lib/api';
import { Admin } from './pages/Admin';
import { Auth } from './pages/Auth';
import { Home } from './pages/Home';
import { MyPawns } from './pages/MyPawns';
import { NotFound } from './pages/NotFound';
import { PawnDetails } from './pages/PawnDetails';
import { PawnEditor } from './pages/PawnEditor';
import { Profile } from './pages/Profile';
import { Support } from './pages/Support';
import type { User } from './types';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }

    api
      .me()
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center bg-ash-950 text-zinc-400">Loading PawnNexus...</div>;
  }

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={() => setUser(null)} />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Auth mode="login" onAuth={setUser} />} />
        <Route path="register" element={<Auth mode="register" onAuth={setUser} />} />
        <Route path="pawns/:id" element={<PawnDetails user={user} />} />
        <Route path="profile" element={<Profile user={user} />} />
        <Route path="support" element={<Support />} />
        <Route path="create" element={<Navigate to="/add-pawn" replace />} />
        <Route
          path="add-pawn"
          element={user ? <PawnEditor mode="create" /> : <Navigate to="/login" replace />}
        />
        <Route
          path="pawns/:id/edit"
          element={user ? <PawnEditor mode="edit" /> : <Navigate to="/login" replace />}
        />
        <Route path="my-pawns" element={user ? <MyPawns /> : <Navigate to="/login" replace />} />
        <Route
          path="admin"
          element={user && (user.role === 'admin' || user.role === 'moderator') ? <Admin currentUser={user} /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
