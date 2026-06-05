import React, { useState } from "react"; 
import { useLocation, Link } from "react-router-dom";
import "./Sidebar.css";

// 🎯 GIỮ NGUYÊN: Import useAuth hệ thống để bốc thông tin đăng nhập thực tế
import { useAuth } from "@/context/AuthContext"; 

// 🎯 GIỮ NGUYÊN: Import Component ProfileModal chuẩn của bạn
import ProfileModal from "./ProfileModal";

// Giữ lại toàn bộ hệ thống icon điều hướng
import iconGroup from "@/assets/icon/Icon-group.svg";
import fridgeMenuIcon from "@/assets/icon/Icon-fridge.svg";
import iconLogo from "@/assets/icon/Icon-logo.svg";
import iconRecipe from "@/assets/icon/Icon-recipe.svg";
import iconSchedule from "@/assets/icon/Icon-schedule.svg";
import iconStatistic from "@/assets/icon/Icon-statistic.svg";
import iconShopping from "@/assets/icon/Icon-shopping.svg";

// Avatar mặc định phòng trường hợp tài khoản chưa cài ảnh
import defaultAvatar from "@/assets/avatar/26.svg";

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  // 🎯 GIỮ NGUYÊN: State kiểm soát việc hiển thị Modal thông tin cá nhân
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  
  // Lấy dữ liệu từ Context (Bây giờ đã cực kỳ giàu trường sau khi sửa file Login)
  const authContext = useAuth();
  const userFromContext = authContext?.user;

  // Phòng vệ chống lệch máy: Bốc thêm từ LocalStorage
  let userFromLocalStorage = null;
  const authUserString = localStorage.getItem("authUser");
  if (authUserString) {
    try {
      userFromLocalStorage = JSON.parse(authUserString);
    } catch (e) {
      console.error("Lỗi parse authUser tại Sidebar:", e);
    }
  }

  // Gốc dữ liệu đăng nhập cơ bản
  const baseAuthUser = userFromContext || userFromLocalStorage;

  // Phân quyền hiển thị vai trò tiếng Việt tốc hành vùng chân Sidebar
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

  // =========================================================================
  // 🎯 TÍNH TOÁN REAL-TIME: Không dùng useEffect để loại bỏ tình trạng render ra null
  // =========================================================================
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

    // Ưu tiên 1: Dữ liệu đồng bộ từ cache xịn của bảng thành viên
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
      // Ưu tiên 2: Dữ liệu siêu đầy đủ từ Context mới (đã bao gồm phone, gender, roleName từ Login mới)
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

  // Quét sạch thuộc tính phục vụ hiển thị nhanh vùng chân Sidebar thô
  const rawName = baseAuthUser?.fullName || baseAuthUser?.full_name || baseAuthUser?.name || "Thành viên Fiza";
  const rawAvatar = baseAuthUser?.avatarUrl || baseAuthUser?.avatar_url || baseAuthUser?.avatar;

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

      {/* Sự kiện onClick mở Modal khi bấm vào vùng Profile */}
      <div 
        className="sidebar-profile-section"
        onClick={() => {
          console.log("👤 [SIDEBAR DEBUG] Đã click vào Avatar vùng chân Sidebar để mở Profile tài khoản chính mình.");
          setIsProfileModalOpen(true);
        }}
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

      {/* =========================================================================
      // 🎯 ĐÃ ĐỒNG BỘ TUYỆT ĐỐI: Dữ liệu được tính trực tiếp, render phát ăn ngay lập tức!
      // ========================================================================= */}
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