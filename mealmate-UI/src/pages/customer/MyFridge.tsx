import React from "react";
import "./MyFridge.css";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

import iconAlert from "@/assets/icon/Icon-alert.svg";
import iconArrow from "@/assets/icon/Icon-arrow.svg";
import iconBox from "@/assets/icon/Icon-box.svg";
import iconClock from "@/assets/icon/Icon-clock.svg";
import iconPlus from "@/assets/icon/Icon-plus.svg";
import iconRecipe from "@/assets/icon/Icon-recipe.svg";
import iconSnowflake from "@/assets/icon/Icon-snowflake.svg";

type FridgeItem = {
  name: string;
  quantity: string;
  location: string;
  subLocation?: string;
  expiryDate: string;
  daysLeft: string;
  icon: string;
  iconBg: string;
  progressColor: string;
  progressWidth: string;
};

const fridgeItems: FridgeItem[] = [
  {
    name: "Cà chua",
    quantity: "500g",
    location: "Ngăn mát",
    subLocation: "Ngăn rau củ",
    expiryDate: "30/04/2026",
    daysLeft: "Còn 4 ngày",
    icon: "🍅",
    iconBg: "#FFE5E5",
    progressColor: "#F59E0B",
    progressWidth: "13.33%",
  },
  {
    name: "Sữa tươi",
    quantity: "1 lít",
    location: "Ngăn mát",
    expiryDate: "28/04/2026",
    daysLeft: "Còn 2 ngày",
    icon: "🥛",
    iconBg: "#E5F3FF",
    progressColor: "#EF4444",
    progressWidth: "6.67%",
  },
  {
    name: "Thịt bò",
    quantity: "300g",
    location: "Ngăn đông",
    expiryDate: "15/05/2026",
    daysLeft: "Còn 19 ngày",
    icon: "🥩",
    iconBg: "#FFEAEA",
    progressColor: "#6ED4B4",
    progressWidth: "63.33%",
  },
  {
    name: "Táo",
    quantity: "6 quả",
    location: "Ngăn mát",
    subLocation: "Ngăn trái cây",
    expiryDate: "02/05/2026",
    daysLeft: "Còn 6 ngày",
    icon: "🍎",
    iconBg: "#FFF4E5",
    progressColor: "#F59E0B",
    progressWidth: "20%",
  },
  {
    name: "Cá hồi",
    quantity: "400g",
    location: "Ngăn đông",
    expiryDate: "10/05/2026",
    daysLeft: "Còn 14 ngày",
    icon: "🐟",
    iconBg: "#E5F9FF",
    progressColor: "#6ED4B4",
    progressWidth: "46.67%",
  },
  {
    name: "Trứng gà",
    quantity: "10 quả",
    location: "Ngăn mát",
    expiryDate: "05/05/2026",
    daysLeft: "Còn 9 ngày",
    icon: "🥚",
    iconBg: "#FFF9E5",
    progressColor: "#6ED4B4",
    progressWidth: "30%",
  },
  {
    name: "Cà rốt",
    quantity: "300 g",
    location: "Ngăn mát",
    subLocation: "Ngăn rau củ",
    expiryDate: "29/04/2026",
    daysLeft: "Còn 3 ngày",
    icon: "🥕",
    iconBg: "#FFE5E5",
    progressColor: "#EF4444",
    progressWidth: "10%",
  },
  {
    name: "Gạo",
    quantity: "2 kg",
    location: "Tủ đồ khô",
    expiryDate: "20/07/2026",
    daysLeft: "Còn 85 ngày",
    icon: "🌾",
    iconBg: "#F5F5E5",
    progressColor: "#6ED4B4",
    progressWidth: "100%",
  },
  {
    name: "Dưa hấu",
    quantity: "1 quả",
    location: "Ngăn mát",
    expiryDate: "27/04/2026",
    daysLeft: "Còn 1 ngày",
    icon: "🍉",
    iconBg: "#FFE5F3",
    progressColor: "#EF4444",
    progressWidth: "3.33%",
  },
];

const MyFridge: React.FC = () => {
  return (
    <div className="my-fridge-layout">
      <Sidebar />

      <div className="my-fridge-page">
        <Topbar />

        <div className="my-fridge">
          <div className="my-fridge-content">
            <main className="my-fridge-main">
              <div className="my-fridge-view-tabs">
                <button className="active">Theo vị trí</button>
                <button>Theo thực phẩm</button>
              </div>

              <div className="my-fridge-filter-tabs">
                <button className="active">Tất cả</button>
                <button>Ngăn mát</button>
                <button>Ngăn đông</button>
                <button>Tủ đồ khô</button>
              </div>

              <section className="my-fridge-grid">
                {fridgeItems.map((item) => (
                  <article className="my-fridge-card" key={item.name}>
                    <div className="my-fridge-card-top">
                      <div
                        className="my-fridge-food-icon"
                        style={{ backgroundColor: item.iconBg }}
                      >
                        {item.icon}
                      </div>

                      <div className="my-fridge-food-info">
                        <h3>{item.name}</h3>
                        <p>{item.quantity}</p>
                      </div>
                    </div>

                    <div className="my-fridge-food-meta">
                      <p>
                        <strong>{item.location}</strong>
                        {item.subLocation && <span> • {item.subLocation}</span>}
                      </p>
                      <p className="expiry-date">HSD: {item.expiryDate}</p>
                    </div>

                    <div className="my-fridge-progress-area">
                      <p>{item.daysLeft}</p>
                      <div className="my-fridge-progress-track">
                        <div
                          className="my-fridge-progress-bar"
                          style={{
                            width: item.progressWidth,
                            backgroundColor: item.progressColor,
                          }}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            </main>

            <aside className="my-fridge-sidebar">
              <section className="my-fridge-summary">
                <div className="summary-card total">
                  <img src={iconBox} alt="" className="summary-icon" />
                  <div>
                    <h2>9</h2>
                    <p>Tổng thực phẩm</p>
                  </div>
                </div>

                <div className="summary-card expiring">
                  <img src={iconClock} alt="" className="summary-icon" />
                  <div>
                    <h2>5</h2>
                    <p>Sắp hết hạn</p>
                  </div>
                </div>

                <div className="status-card temperature">
                  <img src={iconSnowflake} alt="" className="status-icon" />
                  <h2>4°C</h2>
                  <p>Nhiệt độ</p>
                </div>

                <div className="status-card normal">
                  <div className="normal-dot">
                    <span />
                  </div>
                  <h2>Bình thường</h2>
                  <p>Trạng thái</p>
                </div>
              </section>

              <section className="my-fridge-alerts">
                <button className="alert-card danger">
                  <img src={iconAlert} alt="" className="alert-icon" />
                  <span>5 thực phẩm sắp hết hạn</span>
                  <img src={iconArrow} alt="" className="alert-arrow" />
                </button>

                <button className="alert-card neutral">
                  <img src={iconClock} alt="" className="alert-icon" />
                  <span>0 thực phẩm đã hết hạn</span>
                  <img src={iconArrow} alt="" className="alert-arrow" />
                </button>

                <button className="alert-card success">
                  <img src={iconBox} alt="" className="alert-icon" />
                  <span>2 thực phẩm sắp hết</span>
                  <img src={iconArrow} alt="" className="alert-arrow" />
                </button>
              </section>

              <section className="my-fridge-actions">
                <button className="round-action add">
                  <img src={iconPlus} alt="" />
                </button>
                <button className="round-action suggest">
                  <img src={iconRecipe} alt="" />
                </button>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyFridge;