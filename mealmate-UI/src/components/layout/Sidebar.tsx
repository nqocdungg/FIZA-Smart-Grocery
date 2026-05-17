import { useAuth } from "@/context/AuthContext"; // Import useAuth để lấy thông tin user thực
import React from "react";
import { useLocation, Link } from "react-router-dom";
import "./Sidebar.css";

import avatar from "@/assets/avatar/26.svg";

import iconGroup from "@/assets/icon/Icon-group.svg";
import iconShopping from "@/assets/icon/Icon-shopping.svg";
import fridgeMenuIcon from "@/assets/icon/Icon-fridge.svg";
import iconLogo from "@/assets/icon/Icon-logo.svg";
import iconRecipe from "@/assets/icon/Icon-recipe.svg";
import iconSchedule from "@/assets/icon/Icon-schedule.svg";
import iconShopping from "@/assets/icon/Icon-shopping.svg";
import iconStatistic from "@/assets/icon/Icon-statistic.svg";

const Sidebar: React.FC = () => {
  const location = useLocation();

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
          <span className="sidebar-menu-text">Báo cáo &amp; Thống kê</span>
        </Link>
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
            <p>Minh Quang</p>
            <span>Nội trợ</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;