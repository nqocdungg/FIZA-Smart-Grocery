import React, { useState } from "react";
import "./MyFridge.css";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

import FoodDetailPopup from "./FoodDetailPopup";

import iconAlert from "@/assets/icon/Icon-alert.svg";
import iconArrow from "@/assets/icon/Icon-arrow.svg";
import iconBox from "@/assets/icon/Icon-box.svg";
import iconClock from "@/assets/icon/Icon-clock.svg";
import iconPlus from "@/assets/icon/Icon-plus.svg";
import iconRecipe from "@/assets/icon/Icon-recipe.svg";
import iconSnowflake from "@/assets/icon/Icon-snowflake.svg";

type StorageLocation = "COOL" | "FREEZER" | "DRY";
type FridgeItemStatus = "STORED" | "EXPIRED" | "USED";

type CategoryFromDb = {
  id: number;
  name: string;
  icon_key?: string;
  color_code?: string;
};

type PreservationMethodFromDb = {
  id: number;
  food_id: number;
  content: string;
  reference_source?: string;
};

type FoodFromDb = {
  id: number;
  category_id: number;
  name: string;
  unit: string;
  synonyms?: string;
  image_url?: string;
  icon_key?: string;
  is_system: boolean;
  created_by?: number;
  family_id?: number;
  category: CategoryFromDb;
  preservation_methods: PreservationMethodFromDb[];
};

export type FridgeItemFromDb = {
  id: number;
  family_id: number;
  food_id: number;
  quantity: number;
  storage_location: StorageLocation;
  specific_location?: string;
  added_date: string;
  expiry_date: string;
  status: FridgeItemStatus;
  image_url?: string;
  food: FoodFromDb;
};

const CURRENT_DATE = "2026-04-28";

const EXPIRING_SOON_THRESHOLD = 6;
const ALMOST_OUT_COUNT = 2;

const foodIconMap: Record<string, string> = {
  tomato: "🍅",
  milk: "🥛",
  beef: "🥩",
  apple: "🍎",
  fish: "🐟",
  egg: "🥚",
  carrot: "🥕",
  rice: "🌾",
  watermelon: "🍉",
  vegetable: "🥬",
  fruit: "🍎",
  meat: "🥩",
  seafood: "🐟",
  dairy: "🥛",
  dry_food: "🌾",
  spice: "🧂",
  drink: "🥤",
  default_food: "🍽️",
};

const storageLocationLabelMap: Record<StorageLocation, string> = {
  COOL: "Ngăn mát",
  FREEZER: "Ngăn đông",
  DRY: "Tủ đồ khô",
};

const specificLocationLabelMap: Record<string, string> = {
  VEGETABLE_DRAWER: "Ngăn rau củ",
  FRUIT_DRAWER: "Ngăn trái cây",
  DOOR_SHELF: "Cánh tủ",
  TOP_SHELF: "Kệ trên",
  MIDDLE_SHELF: "Kệ giữa",
  BOTTOM_SHELF: "Kệ dưới",
};

const getFoodIcon = (item: FridgeItemFromDb) => {
  const iconKey =
    item.food.icon_key ||
    item.food.category.icon_key ||
    "default_food";

  return foodIconMap[iconKey] || foodIconMap.default_food;
};

const getFoodIconBg = (item: FridgeItemFromDb) => {
  return item.food.category.color_code || "#F1F5F9";
};

const getStorageLocationText = (storageLocation: StorageLocation) => {
  return storageLocationLabelMap[storageLocation];
};

const getSpecificLocationText = (specificLocation?: string) => {
  if (!specificLocation) return "";

  return specificLocationLabelMap[specificLocation] || specificLocation;
};

const getQuantityText = (item: FridgeItemFromDb) => {
  return `${item.quantity}${item.food.unit}`;
};

const formatDateToDisplay = (dateString: string) => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const getDateDiffInDays = (fromDate: string, toDate: string) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffTime = to.getTime() - from.getTime();

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDaysLeft = (expiryDate: string) => {
  return getDateDiffInDays(CURRENT_DATE, expiryDate);
};

const getDaysLeftLabel = (daysLeft: number) => {
  if (daysLeft < 0) return `Quá hạn ${Math.abs(daysLeft)} ngày`;
  if (daysLeft === 0) return "Hết hạn hôm nay";

  return `Còn ${daysLeft} ngày`;
};

const getProgressColor = (daysLeft: number) => {
  if (daysLeft <= 3) return "#EF4444";
  if (daysLeft <= 7) return "#F59E0B";

  return "#6ED4B4";
};

const getProgressTrackColor = (daysLeft: number) => {
  if (daysLeft <= 3) return "#FEE2E2";
  if (daysLeft <= 7) return "#FFEDD5";

  return "#CFE7DF";
};

const getProgressWidth = (addedDate: string, expiryDate: string) => {
  const totalShelfLifeDays = Math.max(
    getDateDiffInDays(addedDate, expiryDate),
    1
  );

  const daysLeft = getDateDiffInDays(CURRENT_DATE, expiryDate);
  const safeDaysLeft = Math.max(daysLeft, 0);

  const percent = Math.min((safeDaysLeft / totalShelfLifeDays) * 100, 100);

  return `${Number(percent.toFixed(2))}%`;
};

const fridgeItemsFromDb: FridgeItemFromDb[] = [
  {
    id: 1,
    family_id: 1,
    food_id: 1,
    quantity: 500,
    storage_location: "COOL",
    specific_location: "VEGETABLE_DRAWER",
    added_date: "2026-04-26",
    expiry_date: "2026-04-30",
    status: "STORED",
    food: {
      id: 1,
      category_id: 1,
      name: "Cà chua",
      unit: "g",
      synonyms: "cà chua,tomato",
      image_url: "",
      icon_key: "tomato",
      is_system: true,
      category: {
        id: 1,
        name: "Rau củ",
        icon_key: "vegetable",
        color_code: "#FFE5E5",
      },
      preservation_methods: [
        {
          id: 1,
          food_id: 1,
          content: "Bảo quản trong ngăn mát ở nhiệt độ phù hợp",
        },
        {
          id: 2,
          food_id: 1,
          content: "Nên để trong ngăn rau củ để giữ độ tươi",
        },
        {
          id: 3,
          food_id: 1,
          content: "Tránh để lẫn với thực phẩm có mùi mạnh",
        },
      ],
    },
  },
  {
    id: 2,
    family_id: 1,
    food_id: 2,
    quantity: 1,
    storage_location: "COOL",
    added_date: "2026-04-26",
    expiry_date: "2026-04-28",
    status: "STORED",
    food: {
      id: 2,
      category_id: 5,
      name: "Sữa tươi",
      unit: "lít",
      synonyms: "sữa tươi,milk",
      image_url: "",
      icon_key: "milk",
      is_system: true,
      category: {
        id: 5,
        name: "Trứng & Sữa",
        icon_key: "dairy",
        color_code: "#E5F3FF",
      },
      preservation_methods: [
        {
          id: 4,
          food_id: 2,
          content: "Luôn đậy kín nắp sau khi sử dụng",
        },
        {
          id: 5,
          food_id: 2,
          content: "Bảo quản trong ngăn mát ở nhiệt độ 2-4°C",
        },
        {
          id: 6,
          food_id: 2,
          content: "Không để gần thực phẩm có mùi mạnh",
        },
      ],
    },
  },
  {
    id: 3,
    family_id: 1,
    food_id: 3,
    quantity: 300,
    storage_location: "FREEZER",
    added_date: "2026-04-26",
    expiry_date: "2026-05-15",
    status: "STORED",
    food: {
      id: 3,
      category_id: 3,
      name: "Thịt bò",
      unit: "g",
      synonyms: "thịt bò,beef",
      image_url: "",
      icon_key: "beef",
      is_system: true,
      category: {
        id: 3,
        name: "Thịt",
        icon_key: "meat",
        color_code: "#FFEAEA",
      },
      preservation_methods: [
        {
          id: 7,
          food_id: 3,
          content: "Bọc kín trước khi cho vào ngăn đông",
        },
        {
          id: 8,
          food_id: 3,
          content: "Rã đông trong ngăn mát trước khi chế biến",
        },
        {
          id: 9,
          food_id: 3,
          content: "Không cấp đông lại sau khi đã rã đông hoàn toàn",
        },
      ],
    },
  },
  {
    id: 4,
    family_id: 1,
    food_id: 4,
    quantity: 6,
    storage_location: "COOL",
    specific_location: "FRUIT_DRAWER",
    added_date: "2026-04-26",
    expiry_date: "2026-05-02",
    status: "STORED",
    food: {
      id: 4,
      category_id: 2,
      name: "Táo",
      unit: "quả",
      synonyms: "táo,apple",
      image_url: "",
      icon_key: "apple",
      is_system: true,
      category: {
        id: 2,
        name: "Trái cây",
        icon_key: "fruit",
        color_code: "#FFF4E5",
      },
      preservation_methods: [
        {
          id: 10,
          food_id: 4,
          content: "Bảo quản trong ngăn trái cây",
        },
        {
          id: 11,
          food_id: 4,
          content: "Tránh để chung với thực phẩm có mùi mạnh",
        },
        {
          id: 12,
          food_id: 4,
          content: "Nên kiểm tra độ tươi trước khi sử dụng",
        },
      ],
    },
  },
  {
    id: 5,
    family_id: 1,
    food_id: 5,
    quantity: 400,
    storage_location: "FREEZER",
    added_date: "2026-04-26",
    expiry_date: "2026-05-10",
    status: "STORED",
    food: {
      id: 5,
      category_id: 4,
      name: "Cá hồi",
      unit: "g",
      synonyms: "cá hồi,salmon",
      image_url: "",
      icon_key: "fish",
      is_system: true,
      category: {
        id: 4,
        name: "Hải sản",
        icon_key: "seafood",
        color_code: "#E5F9FF",
      },
      preservation_methods: [
        {
          id: 13,
          food_id: 5,
          content: "Bảo quản trong ngăn đông nếu chưa dùng ngay",
        },
        {
          id: 14,
          food_id: 5,
          content: "Đóng kín túi hoặc hộp để tránh ám mùi",
        },
        {
          id: 15,
          food_id: 5,
          content: "Rã đông chậm trong ngăn mát trước khi chế biến",
        },
      ],
    },
  },
  {
    id: 6,
    family_id: 1,
    food_id: 6,
    quantity: 10,
    storage_location: "COOL",
    added_date: "2026-04-26",
    expiry_date: "2026-05-05",
    status: "STORED",
    food: {
      id: 6,
      category_id: 5,
      name: "Trứng gà",
      unit: "quả",
      synonyms: "trứng gà,egg",
      image_url: "",
      icon_key: "egg",
      is_system: true,
      category: {
        id: 5,
        name: "Trứng & Sữa",
        icon_key: "dairy",
        color_code: "#FFF9E5",
      },
      preservation_methods: [
        {
          id: 16,
          food_id: 6,
          content: "Để trứng trong khay riêng",
        },
        {
          id: 17,
          food_id: 6,
          content: "Không rửa trứng trước khi bảo quản",
        },
        {
          id: 18,
          food_id: 6,
          content: "Tránh đặt ở cánh tủ nếu nhiệt độ thay đổi nhiều",
        },
      ],
    },
  },
  {
    id: 7,
    family_id: 1,
    food_id: 7,
    quantity: 300,
    storage_location: "COOL",
    specific_location: "VEGETABLE_DRAWER",
    added_date: "2026-04-26",
    expiry_date: "2026-04-29",
    status: "STORED",
    food: {
      id: 7,
      category_id: 1,
      name: "Cà rốt",
      unit: "g",
      synonyms: "cà rốt,carrot",
      image_url: "",
      icon_key: "carrot",
      is_system: true,
      category: {
        id: 1,
        name: "Rau củ",
        icon_key: "vegetable",
        color_code: "#FFE5E5",
      },
      preservation_methods: [
        {
          id: 19,
          food_id: 7,
          content: "Bảo quản trong ngăn rau củ",
        },
        {
          id: 20,
          food_id: 7,
          content: "Giữ khô ráo trước khi cho vào tủ",
        },
        {
          id: 21,
          food_id: 7,
          content: "Nên dùng sớm để giữ độ giòn và vị ngọt",
        },
      ],
    },
  },
  {
    id: 8,
    family_id: 1,
    food_id: 8,
    quantity: 2,
    storage_location: "DRY",
    added_date: "2026-04-26",
    expiry_date: "2026-07-20",
    status: "STORED",
    food: {
      id: 8,
      category_id: 6,
      name: "Gạo",
      unit: "kg",
      synonyms: "gạo,rice",
      image_url: "",
      icon_key: "rice",
      is_system: true,
      category: {
        id: 6,
        name: "Đồ khô",
        icon_key: "dry_food",
        color_code: "#F5F5E5",
      },
      preservation_methods: [
        {
          id: 22,
          food_id: 8,
          content: "Bảo quản nơi khô ráo, thoáng mát",
        },
        {
          id: 23,
          food_id: 8,
          content: "Đậy kín sau khi mở bao bì",
        },
        {
          id: 24,
          food_id: 8,
          content: "Tránh để gần khu vực ẩm hoặc có côn trùng",
        },
      ],
    },
  },
  {
    id: 9,
    family_id: 1,
    food_id: 9,
    quantity: 1,
    storage_location: "COOL",
    added_date: "2026-04-26",
    expiry_date: "2026-04-27",
    status: "STORED",
    food: {
      id: 9,
      category_id: 2,
      name: "Dưa hấu",
      unit: "quả",
      synonyms: "dưa hấu,watermelon",
      image_url: "",
      icon_key: "watermelon",
      is_system: true,
      category: {
        id: 2,
        name: "Trái cây",
        icon_key: "fruit",
        color_code: "#FFE5F3",
      },
      preservation_methods: [
        {
          id: 25,
          food_id: 9,
          content: "Bảo quản trong ngăn mát sau khi cắt",
        },
        {
          id: 26,
          food_id: 9,
          content: "Bọc kín phần đã cắt để tránh mất nước",
        },
        {
          id: 27,
          food_id: 9,
          content: "Nên sử dụng càng sớm càng tốt",
        },
      ],
    },
  },
];

const MyFridge: React.FC = () => {
  const [fridgeItems, setFridgeItems] =
    useState<FridgeItemFromDb[]>(fridgeItemsFromDb);
  const [selectedFood, setSelectedFood] =
    useState<FridgeItemFromDb | null>(null);

  const expiringItemsCount = fridgeItems.filter((item) => {
    const daysLeft = getDaysLeft(item.expiry_date);

    return daysLeft >= 0 && daysLeft <= EXPIRING_SOON_THRESHOLD;
  }).length;

  const expiredItemsCount = fridgeItems.filter((item) => {
    const daysLeft = getDaysLeft(item.expiry_date);

    return daysLeft < 0;
  }).length;

  const handleSaveQuantity = (
    fridgeItemId: number,
    newQuantityValue: number,
    newUnit: string
  ) => {
    setFridgeItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== fridgeItemId) return item;

        return {
          ...item,
          quantity: newQuantityValue,
          food: {
            ...item.food,
            unit: newUnit,
          },
        };
      })
    );

    setSelectedFood(null);
  };

  const handleRemoveFood = (fridgeItemId: number) => {
    setFridgeItems((prevItems) =>
      prevItems.filter((item) => item.id !== fridgeItemId)
    );

    setSelectedFood(null);
  };

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
                {fridgeItems.map((item) => {
                  const daysLeft = getDaysLeft(item.expiry_date);
                  const specificLocationText = getSpecificLocationText(
                    item.specific_location
                  );

                  return (
                    <article
                      className="my-fridge-card"
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedFood(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          setSelectedFood(item);
                        }
                      }}
                    >
                      <div className="my-fridge-card-top">
                        <div
                          className="my-fridge-food-icon"
                          style={{ backgroundColor: getFoodIconBg(item) }}
                        >
                          {getFoodIcon(item)}
                        </div>

                        <div className="my-fridge-food-info">
                          <h3>{item.food.name}</h3>
                          <p>{getQuantityText(item)}</p>
                        </div>
                      </div>

                      <div className="my-fridge-food-meta">
                        <p>
                          <strong>
                            {getStorageLocationText(item.storage_location)}
                          </strong>
                          {specificLocationText && (
                            <span> • {specificLocationText}</span>
                          )}
                        </p>
                        <p className="expiry-date">
                          HSD: {formatDateToDisplay(item.expiry_date)}
                        </p>
                      </div>

                      <div className="my-fridge-progress-area">
                        <p>{getDaysLeftLabel(daysLeft)}</p>
                        <div
                          className="my-fridge-progress-track"
                          style={{
                            backgroundColor: getProgressTrackColor(daysLeft),
                          }}
                        >
                          <div
                            className="my-fridge-progress-bar"
                            style={{
                              width: getProgressWidth(
                                item.added_date,
                                item.expiry_date
                              ),
                              backgroundColor: getProgressColor(daysLeft),
                            }}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            </main>

            <aside className="my-fridge-sidebar">
              <section className="my-fridge-summary">
                <div className="summary-card total">
                  <img src={iconBox} alt="" className="summary-icon" />
                  <div>
                    <h2>{fridgeItems.length}</h2>
                    <p>Tổng thực phẩm</p>
                  </div>
                </div>

                <div className="summary-card expiring">
                  <img src={iconClock} alt="" className="summary-icon" />
                  <div>
                    <h2>{expiringItemsCount}</h2>
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
                  <span>{expiringItemsCount} thực phẩm sắp hết hạn</span>
                  <img src={iconArrow} alt="" className="alert-arrow" />
                </button>

                <button className="alert-card neutral">
                  <img src={iconClock} alt="" className="alert-icon" />
                  <span>{expiredItemsCount} thực phẩm đã hết hạn</span>
                  <img src={iconArrow} alt="" className="alert-arrow" />
                </button>

                <button className="alert-card success">
                  <img src={iconBox} alt="" className="alert-icon" />
                  <span>{ALMOST_OUT_COUNT} thực phẩm sắp hết</span>
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

      {selectedFood && (
        <FoodDetailPopup
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
          onSaveQuantity={handleSaveQuantity}
          onRemoveFood={handleRemoveFood}
        />
      )}
    </div>
  );
};

export default MyFridge;