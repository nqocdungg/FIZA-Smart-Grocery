import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";

import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import ProfileModal from "./ProfileModal";

import fridgeMenuIcon from "@/assets/icon/Icon-fridge.svg";
import iconGroup from "@/assets/icon/Icon-group.svg";
import iconLogo from "@/assets/icon/Icon-logo.svg";
import iconRecipe from "@/assets/icon/Icon-recipe.svg";
import iconSchedule from "@/assets/icon/Icon-schedule.svg";
import iconShopping from "@/assets/icon/Icon-shopping.svg";
import iconStatistic from "@/assets/icon/Icon-statistic.svg";

import defaultAvatar from "@/assets/avatar/26.svg";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const authContext = useAuth();
  const userFromContext = authContext?.user;

  let userFromLocalStorage = null;
  const authUserString = localStorage.getItem("authUser");
  if (authUserString) {
    try {
      userFromLocalStorage = JSON.parse(authUserString);
    } catch (e) {
      console.error("Lỗi parse authUser tại Sidebar:", e);
    }
  }

  const baseAuthUser = userFromContext || userFromLocalStorage;

  const getRoleLabel = (userObj: any) => {
    if (!userObj) return "Thành viên";
    const roleObj = userObj.role;
    const roleName = (typeof roleObj === "object" && roleObj !== null ? roleObj.name : roleObj)
      || userObj.roleName
      || "";
    const normalizedRole = String(roleName).toUpperCase();
    if (
      normalizedRole.includes("ADMIN") ||
      normalizedRole.includes("HOUSEKEEPER") ||
      normalizedRole.includes("BOSS") ||
      normalizedRole.includes("CHỦ NHÀ")
    ) {
      return "Nội trợ";
    }
    return "Thành viên";
  };

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
        console.error("Lỗi xử lý cache tại Sidebar:", e);
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
        fullName: baseAuthUser.fullName || baseAuthUser.full_name || baseAuthUser.name || "Thành viên Fiza",
        roleName: baseAuthUser.roleName || (getRoleLabel(baseAuthUser) === "Nội trợ" ? "Chủ nhà" : "Thành viên"),
        email: baseAuthUser.email || "Chưa cập nhật",
        phone: baseAuthUser.phone || "Chưa cập nhật",
        gender: baseAuthUser.gender || "OTHER",
        avatarUrl: baseAuthUser.avatarUrl || undefined
      };
    }
  }

  const rawName = baseAuthUser?.fullName || baseAuthUser?.full_name || baseAuthUser?.name || "Thành viên Fiza";
  const rawAvatar = baseAuthUser?.avatarUrl || baseAuthUser?.avatar_url || baseAuthUser?.avatar;

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await api.post("/api/auth/logout", {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => { });
      }
    } finally {
      authContext?.logout();
      navigate("/login", { replace: true });
    }
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
          to="/recipes"
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

      {/* Profile + Logout section */}
      <div className="sidebar-bottom">
        <div
          className="sidebar-profile-section"
          onClick={() => setIsProfileModalOpen(true)}
          style={{ cursor: 'pointer' }}
        >
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              <div className="sidebar-avatar-line" />
              <img
                src={rawAvatar || defaultAvatar}
                alt="Avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultAvatar;
                }}
              />
            </div>
            <div className="sidebar-profile-text">
              <p>{rawName}</p>
              <span>{getRoleLabel(baseAuthUser)}</span>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className="sidebar-menu-text">Đăng xuất</span>
        </button>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        familyName={localStorage.getItem("currentFamilyName") || "Gia đình My My"}
        isMe={true}
        memberData={refinedUserData}
      />
    </aside>
  );
};

export default Sidebar;
