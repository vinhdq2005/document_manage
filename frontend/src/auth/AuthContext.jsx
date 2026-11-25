import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { setUnauthorizedHandler, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const [bootError, setBootError] = useState('');

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const loadMe = useCallback(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return () => {};
    }
    let alive = true;
    setLoading(true);
    setBootError('');
    authApi
      .me()
      .then((me) => alive && setUser(me))
      .catch((err) => {
        if (!alive) return;
        // 401: token hết hạn hoặc tài khoản bị khóa -> đăng xuất. Lỗi mạng: giữ token để thử lại.
        if (err.status === 401) tokenStore.clear();
        else setBootError(err.message);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => loadMe(), [loadMe]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    tokenStore.set(res.access_token);
    try {
      setUser(await authApi.me());
    } catch (err) {
      tokenStore.clear();
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, bootError, login, logout, retry: loadMe }),
    [user, loading, bootError, login, logout, loadMe],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
