import React from 'react';
import { BarChart3, BookOpen, LogOut, Users, UtensilsCrossed } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import '@/components/layout/Sidebar.css';
import iconLogo from '@/assets/icon/Icon-logo.svg';

const adminLinks = [
  { to: '/admin/users', label: 'Quản lý người dùng', icon: Users },
  { to: '/admin/foods', label: 'Quản lý thực phẩm', icon: UtensilsCrossed },
  { to: '/admin/recipes', label: 'Quản lý món ăn', icon: BookOpen },
  { to: '/admin/performance', label: 'Quản lý hiệu suất', icon: BarChart3 },
];

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo-section">
        <div className="sidebar-logo">
          <div className="sidebar-logo-box">
            <img src={iconLogo} alt="Logo" className="sidebar-logo-icon" />
          </div>
          <span className="sidebar-brand-full">MealMate</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {adminLinks.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            className={`sidebar-menu-item ${location.pathname === to ? 'active' : ''}`}
            to={to}
          >
            <span className="sidebar-icon-wrap">
              <Icon size={22} strokeWidth={2.2} />
            </span>
            <span className="sidebar-menu-text">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-profile-section">
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              <div className="sidebar-avatar-line" />
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'Admin')}`}
                alt="Admin"
              />
            </div>
            <div className="sidebar-profile-text">
              <p>{user?.fullName || 'Admin'}</p>
              <span>Admin</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={handleLogout}
          aria-label="Đăng xuất"
        >
          <span className="sidebar-icon-wrap">
            <LogOut size={22} strokeWidth={2.2} />
          </span>
          <span className="sidebar-menu-text">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
