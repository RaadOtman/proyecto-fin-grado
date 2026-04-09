import { createContext, useContext, useState } from 'react';
import { logoutUser } from '../lib/apiClient';

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  userId: number | null;
  clubId: number | null;
  login: (email: string, role?: string, id?: number | null, clubId?: number | null) => void;
  logout: () => Promise<void>;
  updateClub: (clubId: number | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('padel_user');
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.email) {
        return {
          email:  p.email  as string,
          role:   (p.role  as string) || 'user',
          id:     (p.id    as number) || null,
          clubId: (p.clubId as number) || null,
        };
      }
    }
  } catch {}
  return { email: null, role: 'user', id: null, clubId: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = readStoredUser();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!stored.email);
  const [isAdmin,         setIsAdmin        ] = useState<boolean>(() => stored.role === 'admin');
  const [userEmail,       setUserEmail      ] = useState<string | null>(() => stored.email);
  const [userId,          setUserId         ] = useState<number | null>(() => stored.id);
  const [clubId,          setClubId         ] = useState<number | null>(() => stored.clubId);

  function login(email: string, role = 'user', id: number | null = null, newClubId: number | null = null) {
    setIsAuthenticated(true);
    setUserEmail(email);
    setIsAdmin(role === 'admin');
    setUserId(id);
    setClubId(newClubId);
    localStorage.setItem('padel_user', JSON.stringify({ email, role, id, clubId: newClubId }));
  }

  function updateClub(newClubId: number | null) {
    setClubId(newClubId);
    try {
      const raw = localStorage.getItem('padel_user');
      if (raw) {
        const p = JSON.parse(raw);
        localStorage.setItem('padel_user', JSON.stringify({ ...p, clubId: newClubId }));
      }
    } catch {}
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {}
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserEmail(null);
    setUserId(null);
    setClubId(null);
    localStorage.removeItem('padel_user');
    localStorage.removeItem('padel_token');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, userEmail, userId, clubId, login, logout, updateClub }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
