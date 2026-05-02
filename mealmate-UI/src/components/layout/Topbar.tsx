import React from "react";
import "./Topbar.css";

import iconSearch from "@/assets/icon/Icon-search.svg";
import iconNotification from "@/assets/icon/Icon-noti.svg";

const Topbar: React.FC = () => {
  return (
    <header className="topbar">
      <div className="topbar-title-wrapper">
        <div className="topbar-title">Tủ lạnh nhà tôi</div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-search">
          <div className="topbar-search-input">
            <div className="topbar-search-text">Tìm kiếm</div>
          </div>

          <div className="topbar-search-icon-wrapper">
            <img src={iconSearch} alt="" className="topbar-search-icon" />
          </div>
        </div>

        <div className="topbar-notification">
          <img src={iconNotification} alt="" className="topbar-bell-icon" />

          <div className="topbar-notification-badge">
            <div>3</div>
          </div>
        </div>

        <div className="topbar-family-button">
          <div>Gia đình siêu nhân</div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;