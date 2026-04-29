import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// TODO: Định nghĩa interface User đầy đủ dựa trên AuthResponse từ backend
interface User {
  userId: number;
  email: string;
  fullName: string;
  accessToken: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // TODO: Quản lý trạng thái xác thực:
  // - Lưu token vào localStorage sau khi login
  // - Đọc token từ localStorage khi app khởi động (persist session)
  // - Phân biệt vai trò ADMIN / CUSTOMER để điều hướng route
  // - Auto logout khi token hết hạn

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('accessToken', userData.accessToken);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
