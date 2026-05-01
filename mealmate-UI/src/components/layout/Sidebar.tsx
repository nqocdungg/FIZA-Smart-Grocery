import React from "react";
import "./Sidebar.css";

import avatar from "@/assets/avatar/26.svg";

import iconGroup from "@/assets/icon/Icon-group.svg";
import iconShopping from "@/assets/icon/Icon-shopping.svg";
import iconFridge from "@/assets/icon/Icon-fridge.svg";
import iconLogo from "@/assets/icon/Icon-logo.svg";
import iconSchedule from "@/assets/icon/Icon-schedule.svg";
import iconStatistic from "@/assets/icon/Icon-statistic.svg";
import iconRecipe from "@/assets/icon/Icon-recipe.svg";

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo-section">
        <div className="sidebar-logo">
          <div className="sidebar-logo-box">
            <img src={iconLogo} alt="" className="sidebar-logo-icon" />
          </div>
          <span className="sidebar-brand-full">Fiza</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <a className="sidebar-menu-item" href="#">
          <span className="sidebar-icon-wrap">
            <img src={iconGroup} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Nhóm gia đình</span>
        </a>

        <a className="sidebar-menu-item active" href="#">
          <span className="sidebar-icon-wrap">
            <img src={iconFridge} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Tủ lạnh nhà tôi</span>
        </a>

        <a className="sidebar-menu-item" href="#">
          <span className="sidebar-icon-wrap">
            <img src={iconShopping} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Kế hoạch đi chợ</span>
        </a>

        <a className="sidebar-menu-item" href="#">
          <span className="sidebar-icon-wrap">
            <img src={iconSchedule} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Kế hoạch bữa ăn</span>
        </a>

        <a className="sidebar-menu-item" href="#">
          <span className="sidebar-icon-wrap">
            <img src={iconRecipe} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Thư viện công thức</span>
        </a>

        <a className="sidebar-menu-item" href="#">
          <span className="sidebar-icon-wrap">
            <img src={iconStatistic} alt="" className="sidebar-menu-icon" />
          </span>
          <span className="sidebar-menu-text">Báo cáo &amp; Thống kê</span>
        </a>
      </nav>

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