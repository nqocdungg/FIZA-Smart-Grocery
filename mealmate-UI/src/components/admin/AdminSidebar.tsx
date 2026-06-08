import React, { useState, useEffect } from 'react';
import { BarChart3, BookOpen, LogOut, Users, UtensilsCrossed } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import '@/components/layout/Sidebar.css';
import iconLogo from '@/assets/icon/Icon-logo.svg';

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

const getValidAvatar = (url: any) => {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null' || url === 'undefined') {
    return null;
  }
  return url;
};

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user: userFromContext } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  
  // 🎯 State cục bộ quản lý chuỗi authUser để ép React re-render khi có cập nhật ảnh
  const [localAuthUser, setLocalAuthUser] = useState<any>(null);

  // Hàm đọc dữ liệu mới nhất từ tủ kính LocalStorage
  const refreshUserCache = () => {
    const authUserString = localStorage.getItem("authUser");
    if (authUserString) {
      try {
        setLocalAuthUser(JSON.parse(authUserString));
      } catch (e) {
        console.error("Lỗi parse authUser tại AdminSidebar:", e);
      }
    }
  };

  // 🎯 LẮNG NGHE ĐỒNG BỘ: Mỗi khi chuyển trang hoặc mở modal, tự động nạp lại cache mới nhất
  useEffect(() => {
    refreshUserCache();

    // Lắng nghe chéo nếu sự thay đổi avatar diễn ra ở một tab/cửa sổ khác
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authUser") {
        refreshUserCache();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [location.pathname, isProfileModalOpen]);

  const baseAuthUser = localAuthUser || userFromContext;

  const rawAvatarFromDB = baseAuthUser?.avatarurl || baseAuthUser?.avatarUrl || baseAuthUser?.avatar_url || baseAuthUser?.avatar;
  const rawAvatar = getValidAvatar(rawAvatarFromDB);
  const rawName = baseAuthUser?.fullName || baseAuthUser?.full_name || baseAuthUser?.name || "Admin";
  const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(baseAuthUser?.email || 'Admin')}`;

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
      const cachedAvatar = foundFullProfile.avatarUrl || foundFullProfile.avatarurl;
      refinedUserData = {
        id: foundFullProfile.id,
        fullName: foundFullProfile.fullName,
        roleName: foundFullProfile.roleName,
        email: foundFullProfile.email,
        phone: foundFullProfile.phone,
        gender: foundFullProfile.gender,
        avatarUrl: rawAvatar || getValidAvatar(cachedAvatar) || fallbackAvatar
      };
    } else {
      refinedUserData = {
        id: currentUserId,
        fullName: rawName,
        roleName: "Admin",
        email: baseAuthUser.email || "Chưa cập nhật",
        phone: baseAuthUser.phone || "Chưa cập nhật",
        gender: baseAuthUser.gender || "OTHER",
        avatarUrl: rawAvatar || fallbackAvatar
      };
    }
  }

  const cachedFamilyName = localStorage.getItem("currentFamilyName");
  const displayFamilyName = hasRealFamilyName(cachedFamilyName)
    ? cachedFamilyName as string
    : hasRealFamilyName(baseAuthUser?.familyName)
      ? baseAuthUser.familyName
      : "Hệ thống";

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar" onMouseEnter={refreshUserCache}>
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
        <div 
          className="sidebar-profile-section"
          onClick={() => {
            refreshUserCache(); // Cập nhật nóng trước khi mở Modal
            setIsProfileModalOpen(true);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              <div className="sidebar-avatar-line" />
              <img
                src={rawAvatar || fallbackAvatar}
                alt="Admin"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackAvatar;
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