import { createContext, useContext, useEffect, useState } from "react";
import api, { tokenStore } from "../api/client";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // dữ liệu từ /auth/me
  const [loading, setLoading] = useState(true);

  // Khi mở lại trang: nếu còn token thì hỏi backend "tôi là ai"
  useEffect(() => {
    async function init() {
      if (!tokenStore.get()) return setLoading(false);
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    tokenStore.set(data.access_token);
    const me = await api.get("/auth/me");
    setUser(me.data);
    return me.data;
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
