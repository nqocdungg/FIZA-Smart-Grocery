import React, { useState } from 'react';
import { BarChart3, BookOpen, LogOut, Users, UtensilsCrossed } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import '@/components/layout/Sidebar.css';
import iconLogo from '@/assets/icon/Icon-logo.svg';

// Import ProfileModal từ thư mục layout (đi ra ngoài 1 cấp)
import ProfileModal from '../layout/ProfileModal';

const adminLinks = [
  { to: '/admin/users', label: 'Quản lý người dùng', icon: Users },
  { to: '/admin/foods', label: 'Quản lý thực phẩm', icon: UtensilsCrossed },
  { to: '/admin/recipes', label: 'Quản lý món ăn', icon: BookOpen },
  { to: '/admin/performance', label: 'Quản lý hiệu suất', icon: BarChart3 },
];

const hasRealFamilyName = (value?: string | null) => {
  return Boolean(
    value &&
    !value.includes("Đang tải") &&
    !value.includes("Äang") &&
    !value.includes("Chưa có gia đình") &&
    !value.includes("ChÆ°a")
  );
};

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user: userFromContext } = useAuth();
  
  // State quản lý việc đóng mở Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // ----------------------------------------------------
  // LOGIC TRÍCH XUẤT DỮ LIỆU USER SANG PROFILE MODAL
  // ----------------------------------------------------
  let userFromLocalStorage = null;
  const authUserString = localStorage.getItem("authUser");
  if (authUserString) {
    try {
      userFromLocalStorage = JSON.parse(authUserString);
    } catch (e) {
      console.error("Lỗi parse authUser tại AdminSidebar:", e);
    }
  }

  const baseAuthUser = userFromContext || userFromLocalStorage;

  let refinedUserData = null;
  if (baseAuthUser) {
    const currentUserId = Number(baseAuthUser.id || baseAuthUser.userId);
    const cachedMembersString = localStorage.getItem("familyMembersCache");
    let foundFullProfile = null;

    if (cachedMembersString) {
      try {
        const cachedMembers = JSON.parse(cachedMembersString);
        if (Array.isArray(cachedMembers)) {
          foundFullProfile = cachedMembers.find((m: any) => Number(m.id) === currentUserId);
        }
      } catch (e) {
        console.error("Lỗi xử lý cache tại AdminSidebar:", e);
      }
    }

    if (foundFullProfile) {
      refinedUserData = {
        id: foundFullProfile.id,
        fullName: foundFullProfile.fullName,
        roleName: foundFullProfile.roleName,
        email: foundFullProfile.email,
        phone: foundFullProfile.phone,
        gender: foundFullProfile.gender,
        avatarUrl: foundFullProfile.avatarUrl
      };
    } else {
      refinedUserData = {
        id: currentUserId,
        fullName: baseAuthUser.fullName || baseAuthUser.full_name || baseAuthUser.name || "Admin",
        roleName: "Admin",
        email: baseAuthUser.email || "Chưa cập nhật",
        phone: baseAuthUser.phone || "Chưa cập nhật",
        gender: baseAuthUser.gender || "OTHER",
        avatarUrl: baseAuthUser.avatarUrl || undefined
      };
    }
  }

  const rawName = baseAuthUser?.fullName || baseAuthUser?.full_name || baseAuthUser?.name || "Admin";
  const cachedFamilyName = localStorage.getItem("currentFamilyName");
  const displayFamilyName = hasRealFamilyName(cachedFamilyName)
    ? cachedFamilyName as string
    : hasRealFamilyName(baseAuthUser?.familyName)
      ? baseAuthUser.familyName
      : "Hệ thống";
  // ----------------------------------------------------

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
          <span className="sidebar-brand-full">Fiza</span>
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
        {/* Lắng nghe sự kiện click để mở Modal giống file Sidebar */}
        <div 
          className="sidebar-profile-section"
          onClick={() => setIsProfileModalOpen(true)}
          style={{ cursor: 'pointer' }}
        >
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              <div className="sidebar-avatar-line" />
              <img
                src={baseAuthUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(baseAuthUser?.email || 'Admin')}`}
                alt="Admin"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent('Admin')}`;
                }}
              />
            </div>
            <div className="sidebar-profile-text">
              <p>{rawName}</p>
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

      {/* Gọi Component ProfileModal truyền đầy đủ props */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        familyName={displayFamilyName}
        isMe={true}
        memberData={refinedUserData}
      />
    </aside>
  );
};

export default AdminSidebar;