import { useAuth } from "@/context/AuthContext"; // Import useAuth để lấy thông tin user thực
import React from "react";
import { useLocation, Link } from "react-router-dom";
import "./Sidebar.css";

import avatar from "@/assets/avatar/26.svg";

import iconGroup from "@/assets/icon/Icon-group.svg";
import fridgeMenuIcon from "@/assets/icon/Icon-fridge.svg";
import iconLogo from "@/assets/icon/Icon-logo.svg";
import iconRecipe from "@/assets/icon/Icon-recipe.svg";
import iconSchedule from "@/assets/icon/Icon-schedule.svg";
import iconShopping from "@/assets/icon/Icon-shopping.svg";
import iconStatistic from "@/assets/icon/Icon-statistic.svg";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

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
        <Link
          className={`sidebar-menu-item ${location.pathname === "/family" ? "active" : ""}`}
          to="/family"
        >
          <span className="sidebar-icon-wrap">
            <img src={iconGroup} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Nhóm gia đình</span>
        </Link>

        <Link
          className={`sidebar-menu-item ${location.pathname === "/fridge" || location.pathname === "/" ? "active" : ""}`}
          to="/fridge"
        >
          <span className="sidebar-icon-wrap">
            <img src={fridgeMenuIcon} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Tủ lạnh nhà tôi</span>
        </Link>

        <Link
          className={`sidebar-menu-item ${location.pathname === "/shopping" ? "active" : ""}`}
          to="/shopping"
        >
          <span className="sidebar-icon-wrap">
            <img src={iconShopping} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Kế hoạch đi chợ</span>
        </Link>

        <Link
          className={`sidebar-menu-item ${location.pathname === "/suggestions" ? "active" : ""}`}
          to="/suggestions"
        >
          <span className="sidebar-icon-wrap">
            <img src={iconSchedule} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Kế hoạch bữa ăn</span>
        </Link>

        <Link
          className={`sidebar-menu-item ${location.pathname === "/recipes" ? "active" : ""}`}
          to="#"
        >
          <span className="sidebar-icon-wrap">
            <img src={iconRecipe} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Thư viện công thức</span>
        </Link>

        <Link
          className={`sidebar-menu-item ${location.pathname === "/reports" ? "active" : ""}`}
          to="/reports"
        >
          <span className="sidebar-icon-wrap">
            <img src={iconStatistic} alt="" className="sidebar-menu-icon" />
          </span>
        </Link>

        <button
          className="sidebar-menu-item"
          onClick={logout}
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#ef4444',
            marginTop: '2rem'
          }}
        >
          <span className="sidebar-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </span>
          <span className="sidebar-menu-text" style={{ fontWeight: 600 }}>Đăng xuất</span>
        </button>
      </nav>

      {/* <div className="sidebar-profile-section">
        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            <div className="sidebar-avatar-line" />
            <img src={user?.avatar || defaultAvatar} alt="Avatar" />
          </div>

          <div className="sidebar-profile-text">
            {/* Hiển thị tên thực từ database */}
      {/* <p>{user?.full_name || "Khách"}</p>
            <span>{user?.role === 'CUSTOMER' ? 'Thành viên' : 'Nội trợ'}</span>
          </div>
        </div>
      </div> */}
      <div className="sidebar-profile-section">
        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            <div className="sidebar-avatar-line" />
            <img src={avatar} alt="" />
          </div>

          <div className="sidebar-profile-text">
            <p>{user?.fullName || "Minh Quang"}</p>
            <span>{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Nội trợ'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;