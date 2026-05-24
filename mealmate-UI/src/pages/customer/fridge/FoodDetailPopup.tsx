import React, { useState } from "react";
import "./FoodDetailPopup.css";

import type { FridgeItemFromApi, RemoveReasonCode } from "./MyFridge";

import iconAlert from "@/assets/icon/Icon-alert.svg";
import iconClose from "@/assets/icon/Icon-close.svg";
import iconInfo from "@/assets/icon/Icon-info.svg";
import iconMinus from "@/assets/icon/Icon-minus.svg";
import iconPlus from "@/assets/icon/Icon-plus.svg";

type FoodDetailPopupProps = {
  food: FridgeItemFromApi;
  onClose: () => void;
  onSaveQuantity: (fridgeItemId: number, newQuantityValue: number) => Promise<void>;
  onRemoveFood: (
    fridgeItemId: number,
    removedReason: RemoveReasonCode,
    removedReasonNote?: string
  ) => Promise<void>;
};

const REMOVE_REASONS: Array<{ label: string; value: RemoveReasonCode }> = [
  { label: "Đã dùng hết", value: "USED_UP" },
  { label: "Đã bỏ đi do hết hạn", value: "EXPIRED_DISCARDED" },
  { label: "Thực phẩm bị hỏng", value: "SPOILED" },
  { label: "Nhập sai thông tin", value: "WRONG_INFO" },
  { label: "Khác", value: "OTHER" },
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
  "dry-food": "🌾",
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

const getFoodName = (food: FridgeItemFromApi) => {
  return food.displayName || food.standardFoodName || "Thực phẩm";
};

const getFoodIcon = (food: FridgeItemFromApi) => {
  const iconKey = food.categoryIconKey || "default_food";
  return foodIconMap[iconKey] || foodIconMap.default_food;
};

const getFoodIconBg = (food: FridgeItemFromApi) => {
  return food.categoryColorCode || "#F1F5F9";
};

const getStorageLocationText = (storageLocation?: string) => {
  if (!storageLocation) return "Chưa phân loại";
  return storageLocationLabelMap[storageLocation] || storageLocation;
};

const getSpecificLocationText = (specificLocation?: string) => {
  if (!specificLocation) return "Chưa phân loại";
  return specificLocationLabelMap[specificLocation] || specificLocation;
};

const getQuantityText = (food: FridgeItemFromApi) => {
  return `${food.quantity}${food.unit ? ` ${food.unit}` : ""}`;
};

const toLocalDate = (dateString?: string) => {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateToDisplay = (dateString?: string) => {
  const date = toLocalDate(dateString);
  if (!date) return "Chưa có";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const getDateDiffInDays = (fromDate: Date, toDate: Date) => {
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
};

const getDaysLeft = (expiryDate?: string) => {
  const expiry = toLocalDate(expiryDate);
  if (!expiry) return null;
  return getDateDiffInDays(new Date(), expiry);
};

const getDaysLeftLabel = (daysLeft: number | null) => {
  if (daysLeft === null) return "Chưa có hạn sử dụng";
  if (daysLeft < 0) return `Quá hạn ${Math.abs(daysLeft)} ngày`;
  if (daysLeft === 0) return "Hết hạn hôm nay";
  return `Còn ${daysLeft} ngày`;
};

const getExpiryStatusClass = (daysLeft: number | null) => {
  if (daysLeft === null) return "safe";
  if (daysLeft <= 3) return "danger";
  return "safe";
};

const getProgressColor = (daysLeft: number | null) => {
  if (daysLeft === null) return "#94A3B8";
  if (daysLeft <= 3) return "#EF4444";
  return "#6ED4B4";
};

const getProgressTrackColor = (daysLeft: number | null) => {
  if (daysLeft === null) return "#E2E8F0";
  if (daysLeft <= 3) return "#FEE2E2";
  return "#CFE7DF";
};

const getProgressWidth = (addedDate?: string, expiryDate?: string) => {
  const added = toLocalDate(addedDate);
  const expiry = toLocalDate(expiryDate);
  if (!added || !expiry) return "100%";

  const totalShelfLifeDays = Math.max(getDateDiffInDays(added, expiry), 1);
  const daysLeft = Math.max(getDateDiffInDays(new Date(), expiry), 0);
  const percent = Math.min((daysLeft / totalShelfLifeDays) * 100, 100);
  return `${Number(percent.toFixed(2))}%`;
};

const getExpiryMessage = (daysLeft: number | null) => {
  if (daysLeft === null) {
    return "Thực phẩm chưa có hạn sử dụng, nên bổ sung để hệ thống nhắc hạn chính xác.";
  }

  if (daysLeft < 0) {
    return `Sản phẩm đã quá hạn ${Math.abs(daysLeft)} ngày, nên kiểm tra trước khi sử dụng.`;
  }

  if (daysLeft === 0) {
    return "Sản phẩm hết hạn hôm nay, nên sử dụng hoặc xử lý trong ngày.";
  }

  if (daysLeft <= 3) {
    return `Sản phẩm gần hết hạn, nên sử dụng trong ${daysLeft} ngày tới.`;
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
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [removeReason, setRemoveReason] = useState<RemoveReasonCode | "">("");
  const [customRemoveReason, setCustomRemoveReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const daysLeft = getDaysLeft(food.expiryDate);
  const expiryStatusClass = getExpiryStatusClass(daysLeft);
  const step = food.unit === "g" ? 50 : 1;
  const isConfirmDisabled = !removeReason || (removeReason === "OTHER" && !customRemoveReason.trim());

  const handleDecrease = () => {
    setQuantityValue((prev) => Math.max(step === 50 ? 0 : 1, prev - step));
  };

  const handleIncrease = () => {
    setQuantityValue((prev) => prev + step);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setActionError("");

    try {
      await onSaveQuantity(food.id, quantityValue);
    } catch {
      setActionError("Không lưu được số lượng.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (isConfirmDisabled || !removeReason) return;

    setIsSaving(true);
    setActionError("");

    try {
      await onRemoveFood(food.id, removeReason, customRemoveReason.trim() || undefined);
    } catch {
      setActionError("Không loại được thực phẩm khỏi tủ lạnh.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="food-detail-overlay" onClick={onClose}>
      <aside className="food-detail-popup" onClick={(event) => event.stopPropagation()}>
        <header className="food-detail-header">
          <div className="food-detail-title-group">
            <div className="food-detail-icon" style={{ backgroundColor: getFoodIconBg(food) }}>
              {getFoodIcon(food)}
            </div>

            <div>
              <h2>{getFoodName(food)}</h2>
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
                <strong>{food.categoryName || "Chưa phân loại"}</strong>
              </div>

              <div className="food-detail-info-card">
                <span>Số lượng</span>
                <strong>{getQuantityText(food)}</strong>
              </div>

              <div className="food-detail-info-card">
                <span>Vị trí chính</span>
                <strong>{getStorageLocationText(food.storageLocation)}</strong>
              </div>

              <div className="food-detail-info-card">
                <span>Vị trí cụ thể</span>
                <strong>{getSpecificLocationText(food.specificLocation)}</strong>
              </div>

              <div className="food-detail-info-card">
                <span>Ngày nhập</span>
                <strong>{formatDateToDisplay(food.addedDate)}</strong>
              </div>

              <div className="food-detail-info-card">
                <span>Hạn sử dụng</span>
                <strong>{formatDateToDisplay(food.expiryDate)}</strong>
              </div>
            </div>
          </section>

          <section className={`food-detail-expiry-box ${expiryStatusClass}`}>
            <div className="food-detail-expiry-top">
              <span>Thời gian còn lại</span>
              <strong>{getDaysLeftLabel(daysLeft)}</strong>
            </div>

            <div className="food-detail-expiry-track" style={{ backgroundColor: getProgressTrackColor(daysLeft) }}>
              <div
                className="food-detail-expiry-progress"
                style={{
                  width: getProgressWidth(food.addedDate, food.expiryDate),
                  backgroundColor: getProgressColor(daysLeft),
                }}
              />
            </div>

            <p>{getExpiryMessage(daysLeft)}</p>
          </section>

          <section className="food-detail-section">
            <h3>Hướng dẫn bảo quản</h3>

            <div className="food-detail-storage-box">
              {(food.preservationMethods?.length ? food.preservationMethods : ["Chưa có hướng dẫn bảo quản cho thực phẩm này."]).map(
                (method) => (
                  <div className="food-detail-tip" key={method}>
                    <img src={iconInfo} alt="" />
                    <span>{method}</span>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="food-detail-section">
            <h3>Cập nhật số lượng</h3>

            <div className="food-detail-quantity-row">
              <button onClick={handleDecrease} aria-label="Giảm số lượng" disabled={isSaving}>
                <img src={iconMinus} alt="" className="food-detail-quantity-icon" />
              </button>

              <div className="food-detail-quantity-value">{quantityValue}</div>

              <div className="food-detail-unit" aria-label="Đơn vị">
                {food.unit || "Đơn vị"}
              </div>

              <button onClick={handleIncrease} aria-label="Tăng số lượng" disabled={isSaving}>
                <img src={iconPlus} alt="" className="food-detail-quantity-icon" />
              </button>
            </div>

            {actionError && <p className="food-detail-action-error">{actionError}</p>}

            <div className="food-detail-action-row">
              <button className="food-detail-cancel-button" onClick={onClose} disabled={isSaving}>
                Hủy
              </button>

              <button className="food-detail-save-button" onClick={handleSave} disabled={isSaving || quantityValue <= 0}>
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </section>

          <section className="food-detail-remove-section">
            <button className="food-detail-remove-button" onClick={() => setIsRemoveConfirmOpen(true)} disabled={isSaving}>
              <img src={iconAlert} alt="" />
              Loại khỏi tủ lạnh
            </button>

            <p>Thực phẩm sẽ được loại khỏi danh sách hiện tại.</p>
          </section>
        </div>
      </aside>

      {isRemoveConfirmOpen && (
        <div className="food-remove-confirm-layer" onClick={(event) => event.stopPropagation()}>
          <div className="food-remove-confirm-dialog">
            <h2>Loại bỏ thực phẩm khỏi tủ lạnh?</h2>
            <p className="food-remove-confirm-subtitle">Vui lòng chọn lý do loại bỏ thực phẩm này.</p>

            <div className="food-remove-confirm-food">
              <div className="food-remove-confirm-icon">{getFoodIcon(food)}</div>
              <div className="food-remove-confirm-name">{getFoodName(food)}</div>
            </div>

            <div className="food-remove-confirm-reasons">
              {REMOVE_REASONS.map((reason) => (
                <label className="food-remove-confirm-reason" key={reason.value}>
                  <input
                    type="radio"
                    name="remove-reason"
                    value={reason.value}
                    checked={removeReason === reason.value}
                    onChange={(event) => {
                      setRemoveReason(event.target.value as RemoveReasonCode);

                      if (event.target.value !== "OTHER") {
                        setCustomRemoveReason("");
                      }
                    }}
                  />
                  <span className="food-remove-confirm-radio" />
                  <span className="food-remove-confirm-reason-text">{reason.label}</span>
                </label>
              ))}

              {removeReason === "OTHER" && (
                <textarea
                  className="food-remove-confirm-other-input"
                  value={customRemoveReason}
                  onChange={(event) => setCustomRemoveReason(event.target.value)}
                  placeholder="Nhập lý do khác"
                />
              )}
            </div>

            <div className="food-remove-confirm-actions">
              <button
                className="food-remove-confirm-cancel"
                disabled={isSaving}
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
                disabled={isConfirmDisabled || isSaving}
                onClick={handleConfirmRemove}
              >
                {isSaving ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDetailPopup;
