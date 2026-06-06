import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession } from '@/features/auth/types/auth';
import { getAuthRoleName } from '@/features/auth/role';

// 🎯 ĐÃ BỔ SUNG: Định nghĩa các trường dữ liệu chi tiết (Bao gồm cả avatarUrl)
interface ExtendedAuthFields {
  phone?: string;
  gender?: string;
  roleName?: string;
  avatarUrl?: string; // Đồng bộ ảnh đại diện tươi mới từ DB lúc Login
}

// Kết hợp thuộc tính AuthSession gốc với các trường chi tiết mở rộng bằng dấu &
type ExtendedAuthSession = AuthSession & ExtendedAuthFields;

interface AuthContextType {
  user: ExtendedAuthSession | null;
  isAuthenticated: boolean;
  login: (user: ExtendedAuthSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'authUser';

const readStoredUser = (): ExtendedAuthSession | null => {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser) as ExtendedAuthSession;
    const normalizedRole = getAuthRoleName(parsedUser);
    if (!parsedUser?.accessToken || !normalizedRole) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('accessToken');
      return null;
    }
    return { ...parsedUser, role: normalizedRole };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedAuthSession | null>(() => readStoredUser());

  const login = (userData: ExtendedAuthSession) => {
    const normalizedUser = { ...userData, role: getAuthRoleName(userData) };
    setUser(normalizedUser);
    localStorage.setItem('accessToken', normalizedUser.accessToken);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // 🎯 ĐÃ THÊM: Dọn dẹp sạch sẽ toàn bộ cache bối cảnh gia đình để tránh leak dữ liệu sang phiên sau
    localStorage.removeItem('currentFamilyName');
    localStorage.removeItem('familyMembersCache');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user?.accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
};

export default AuthContext;
