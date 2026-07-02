import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { api, getToken } from './lib/api';
import { Admin } from './pages/Admin';
import { Auth } from './pages/Auth';
import { Faq } from './pages/Faq';
import { ForgotPassword } from './pages/ForgotPassword';
import { Home } from './pages/Home';
import { MyPawns } from './pages/MyPawns';
import { NotFound } from './pages/NotFound';
import { PawnDetails } from './pages/PawnDetails';
import { PawnEditor } from './pages/PawnEditor';
import { Profile } from './pages/Profile';
import { Support } from './pages/Support';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { VerifyRequired } from './pages/VerifyRequired';
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
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<VerifyEmail onVerified={setUser} />} />
        <Route
          path="verify-required"
          element={user ? <VerifyRequired user={user} onUserUpdate={setUser} /> : <Navigate to="/login" replace />}
        />
        <Route path="pawns/:id" element={<PawnDetails user={user} />} />
        <Route path="profile" element={<Profile user={user} />} />
        <Route path="faq" element={<Faq />} />
        <Route path="support" element={<Support />} />
        <Route path="create" element={<Navigate to="/add-pawn" replace />} />
        <Route
          path="add-pawn"
          element={user ? (user.emailVerifiedAt ? <PawnEditor mode="create" /> : <Navigate to="/verify-required" replace />) : <Navigate to="/login" replace />}
        />
        <Route
          path="pawns/:id/edit"
          element={user ? (user.emailVerifiedAt ? <PawnEditor mode="edit" /> : <Navigate to="/verify-required" replace />) : <Navigate to="/login" replace />}
        />
        <Route path="my-pawns" element={user ? <MyPawns /> : <Navigate to="/login" replace />} />
        <Route
          path="admin"
          element={user && user.emailVerifiedAt && (user.role === 'admin' || user.role === 'moderator') ? <Admin currentUser={user} /> : <Navigate to={user ? '/verify-required' : '/'} replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
