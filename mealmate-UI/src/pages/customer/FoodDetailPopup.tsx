import React, { useEffect, useState } from "react";
import "./FoodDetailPopup.css";

import type { FridgeItemFromDb } from "./MyFridge";

import iconAlert from "@/assets/icon/Icon-alert.svg";
import iconClose from "@/assets/icon/Icon-close.svg";
import iconInfo from "@/assets/icon/Icon-info.svg";
import iconMinus from "@/assets/icon/Icon-minus.svg";
import iconPlus from "@/assets/icon/Icon-plus.svg";

type FoodDetailPopupProps = {
  food: FridgeItemFromDb;
  onClose: () => void;
  onSaveQuantity: (
    fridgeItemId: number,
    newQuantityValue: number,
    newUnit: string
  ) => void;
  onRemoveFood: (fridgeItemId: number) => void;
};

const CURRENT_DATE = "2026-04-28";

const STANDARD_UNITS = ["g", "kg", "lít", "quả"];

const REMOVE_REASONS = [
  "Đã dùng hết",
  "Đã bỏ đi do hết hạn",
  "Thực phẩm bị hỏng",
  "Nhập sai thông tin",
  "Khác",
];

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

const storageLocationLabelMap: Record<string, string> = {
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

const getFoodIcon = (food: FridgeItemFromDb) => {
  const iconKey =
    food.food.icon_key || food.food.category.icon_key || "default_food";

  return foodIconMap[iconKey] || foodIconMap.default_food;
};

const getFoodIconBg = (food: FridgeItemFromDb) => {
  return food.food.category.color_code || "#F1F5F9";
};

const getStorageLocationText = (storageLocation: string) => {
  return storageLocationLabelMap[storageLocation] || storageLocation;
};

const getSpecificLocationText = (specificLocation?: string) => {
  if (!specificLocation) return "Chưa phân loại";

  return specificLocationLabelMap[specificLocation] || specificLocation;
};

const getQuantityText = (food: FridgeItemFromDb) => {
  return `${food.quantity}${food.food.unit}`;
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

const getExpiryStatusClass = (daysLeft: number) => {
  if (daysLeft <= 2) return "danger";
  if (daysLeft <= 6) return "warning";

  return "safe";
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

const getExpiryMessage = (daysLeft: number) => {
  if (daysLeft < 0) {
    return `Sản phẩm đã quá hạn ${Math.abs(
      daysLeft
    )} ngày, nên kiểm tra trước khi sử dụng.`;
  }

  if (daysLeft === 0) {
    return "Sản phẩm hết hạn hôm nay, nên sử dụng hoặc xử lý trong ngày.";
  }

  if (daysLeft <= 2) {
    return `Sản phẩm gần hết hạn, nên sử dụng trong ${daysLeft} ngày tới.`;
  }

  if (daysLeft <= 6) {
    return `Sản phẩm sắp hết hạn, nên sử dụng trong ${daysLeft} ngày tới.`;
  }

  return "Sản phẩm vẫn còn hạn sử dụng tốt.";
};

const FoodDetailPopup: React.FC<FoodDetailPopupProps> = ({
  food,
  onClose,
  onSaveQuantity,
  onRemoveFood,
}) => {
  const [quantityValue, setQuantityValue] = useState(food.quantity);
  const [selectedUnit, setSelectedUnit] = useState(food.food.unit);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [removeReason, setRemoveReason] = useState("");
  const [customRemoveReason, setCustomRemoveReason] = useState("");

  useEffect(() => {
    setQuantityValue(food.quantity);
    setSelectedUnit(food.food.unit);
    setIsRemoveConfirmOpen(false);
    setRemoveReason("");
    setCustomRemoveReason("");
  }, [food]);

  const daysLeft = getDaysLeft(food.expiry_date);
  const expiryStatusClass = getExpiryStatusClass(daysLeft);
  const step = selectedUnit === "g" ? 50 : 1;

  const unitOptions = STANDARD_UNITS.includes(food.food.unit)
    ? STANDARD_UNITS
    : [food.food.unit, ...STANDARD_UNITS];

  const isConfirmDisabled =
    !removeReason || (removeReason === "Khác" && !customRemoveReason.trim());

  const handleDecrease = () => {
    setQuantityValue((prev) => Math.max(0, prev - step));
  };

  const handleIncrease = () => {
    setQuantityValue((prev) => prev + step);
  };

  const handleSave = () => {
    onSaveQuantity(food.id, quantityValue, selectedUnit);
  };

  const handleConfirmRemove = () => {
    if (isConfirmDisabled) return;

    onRemoveFood(food.id);
  };

  return (
    <div className="food-detail-overlay" onClick={onClose}>
      <aside
        className="food-detail-popup"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="food-detail-header">
          <div className="food-detail-title-group">
            <div
              className="food-detail-icon"
              style={{ backgroundColor: getFoodIconBg(food) }}
            >
              {getFoodIcon(food)}
            </div>

            <div>
              <h2>{food.food.name}</h2>
            </div>
          </div>

          <button className="food-detail-close" onClick={onClose} aria-label="Đóng">
            <img src={iconClose} alt="" />
          </button>
        </header>

        <div className="food-detail-body">
          <section className="food-detail-section">
            <h3>Thông tin chi tiết</h3>

            <div className="food-detail-info-grid">
              <div className="food-detail-info-card">
                <span>Danh mục</span>
                <strong>{food.food.category.name}</strong>
              </div>

              <div className="food-detail-info-card">
                <span>Số lượng</span>
                <strong>{getQuantityText(food)}</strong>
              </div>

              <div className="food-detail-info-card">
                <span>Vị trí chính</span>
                <strong>{getStorageLocationText(food.storage_location)}</strong>
              </div>

              <div className="food-detail-info-card">
                <span>Vị trí cụ thể</span>
                <strong>{getSpecificLocationText(food.specific_location)}</strong>
              </div>

              <div className="food-detail-info-card">
                <span>Ngày nhập</span>
                <strong>{formatDateToDisplay(food.added_date)}</strong>
              </div>

              <div className="food-detail-info-card">
                <span>Hạn sử dụng</span>
                <strong>{formatDateToDisplay(food.expiry_date)}</strong>
              </div>
            </div>
          </section>

          <section className={`food-detail-expiry-box ${expiryStatusClass}`}>
            <div className="food-detail-expiry-top">
              <span>Thời gian còn lại</span>
              <strong>{getDaysLeftLabel(daysLeft)}</strong>
            </div>

            <div
              className="food-detail-expiry-track"
              style={{ backgroundColor: getProgressTrackColor(daysLeft) }}
            >
              <div
                className="food-detail-expiry-progress"
                style={{
                  width: getProgressWidth(food.added_date, food.expiry_date),
                  backgroundColor: getProgressColor(daysLeft),
                }}
              />
            </div>

            <p>{getExpiryMessage(daysLeft)}</p>
          </section>

          <section className="food-detail-section">
            <h3>Hướng dẫn bảo quản</h3>

            <div className="food-detail-storage-box">
              {food.food.preservation_methods.map((method) => (
                <div className="food-detail-tip" key={method.id}>
                  <img src={iconInfo} alt="" />
                  <span>{method.content}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="food-detail-section">
            <h3>Cập nhật số lượng</h3>

            <div className="food-detail-quantity-row">
              <button onClick={handleDecrease} aria-label="Giảm số lượng">
                <img
                  src={iconMinus}
                  alt=""
                  className="food-detail-quantity-icon"
                />
              </button>

              <div className="food-detail-quantity-value">{quantityValue}</div>

              <select
                className="food-detail-unit"
                value={selectedUnit}
                onChange={(event) => setSelectedUnit(event.target.value)}
                aria-label="Chọn đơn vị"
              >
                {unitOptions.map((unit) => (
                  <option value={unit} key={unit}>
                    {unit}
                  </option>
                ))}
              </select>

              <button onClick={handleIncrease} aria-label="Tăng số lượng">
                <img
                  src={iconPlus}
                  alt=""
                  className="food-detail-quantity-icon"
                />
              </button>
            </div>

            <div className="food-detail-action-row">
              <button className="food-detail-cancel-button" onClick={onClose}>
                Hủy
              </button>

              <button className="food-detail-save-button" onClick={handleSave}>
                Lưu thay đổi
              </button>
            </div>
          </section>

          <section className="food-detail-remove-section">
            <button
              className="food-detail-remove-button"
              onClick={() => setIsRemoveConfirmOpen(true)}
            >
              <img src={iconAlert} alt="" />
              Loại khỏi tủ lạnh
            </button>

            <p>Thực phẩm sẽ được loại khỏi danh sách hiện tại.</p>
          </section>
        </div>
      </aside>

      {isRemoveConfirmOpen && (
        <div
          className="food-remove-confirm-layer"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="food-remove-confirm-dialog">
            <h2>Loại bỏ thực phẩm khỏi tủ lạnh?</h2>
            <p className="food-remove-confirm-subtitle">
              Vui lòng chọn lý do loại bỏ thực phẩm này.
            </p>

            <div className="food-remove-confirm-food">
              <div className="food-remove-confirm-icon">{getFoodIcon(food)}</div>
              <div className="food-remove-confirm-name">{food.food.name}</div>
            </div>

            <div className="food-remove-confirm-reasons">
              {REMOVE_REASONS.map((reason) => (
                <label className="food-remove-confirm-reason" key={reason}>
                  <input
                    type="radio"
                    name="remove-reason"
                    value={reason}
                    checked={removeReason === reason}
                    onChange={(event) => {
                      setRemoveReason(event.target.value);

                      if (event.target.value !== "Khác") {
                        setCustomRemoveReason("");
                      }
                    }}
                  />
                  <span className="food-remove-confirm-radio" />
                  <span className="food-remove-confirm-reason-text">
                    {reason}
                  </span>
                </label>
              ))}

              {removeReason === "Khác" && (
                <textarea
                  className="food-remove-confirm-other-input"
                  value={customRemoveReason}
                  onChange={(event) =>
                    setCustomRemoveReason(event.target.value)
                  }
                  placeholder="Nhập lý do khác"
                />
              )}
            </div>

            <div className="food-remove-confirm-actions">
              <button
                className="food-remove-confirm-cancel"
                onClick={() => {
                  setIsRemoveConfirmOpen(false);
                  setRemoveReason("");
                  setCustomRemoveReason("");
                }}
              >
                Hủy
              </button>

              <button
                className="food-remove-confirm-submit"
                disabled={isConfirmDisabled}
                onClick={handleConfirmRemove}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDetailPopup;