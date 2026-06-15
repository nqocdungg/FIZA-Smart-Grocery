import React, { useEffect, useMemo, useState } from "react";
import { PencilLine } from "lucide-react";
import api from "@/services/api";
import "./FoodDetailPopup.css";

import type { FridgeItemFromApi, RemoveReasonCode, UpdateFridgeItemPayload } from "./MyFridge";

import iconAlert from "@/assets/icon/Icon-alert.svg";
import iconClose from "@/assets/icon/Icon-close.svg";
import iconInfo from "@/assets/icon/Icon-info.svg";
import iconMinus from "@/assets/icon/Icon-minus.svg";
import iconPlus from "@/assets/icon/Icon-plus.svg";
import iconShopping from "@/assets/icon/Icon-shopping.svg";

type StorageLocation = "COOL" | "FREEZER" | "DRY";

type FoodFromApi = {
  id: number;
  categoryId?: number;
  categoryName?: string;
  name: string;
  unit?: string;
  synonyms?: string;
};

type SelectOption = {
  label: string;
  value: string;
};

type EditFormState = {
  foodName: string;
  selectedFood: FoodFromApi | null;
  customName: string;
  quantity: string;
  storageLocation: StorageLocation | "";
  specificLocation: string;
  addedDate: string;
  expiryDate: string;
  note: string;
};

type FoodDetailPopupProps = {
  food: FridgeItemFromApi;
  onClose: () => void;
  onSaveFoodDetails: (fridgeItemId: number, payload: UpdateFridgeItemPayload) => Promise<void>;
  onRemoveFood: (
    fridgeItemId: number,
    removedReason: RemoveReasonCode,
    removedReasonNote?: string
  ) => Promise<void>;
  /** Thêm thực phẩm này vào hàng chờ Kế hoạch đi chợ. */
  onAddToShoppingPlan?: (food: FridgeItemFromApi) => void;
};

const REMOVE_REASONS: Array<{ label: string; value: RemoveReasonCode }> = [
  { label: "Đã dùng hết", value: "USED_UP" },
  { label: "Đã bỏ đi do hết hạn", value: "EXPIRED_DISCARDED" },
  { label: "Thực phẩm bị hỏng", value: "SPOILED" },
  { label: "Nhập sai thông tin", value: "WRONG_INFO" },
  { label: "Khác", value: "OTHER" },
];

const storageLocationOptions: SelectOption[] = [
  { label: "Ngăn mát", value: "COOL" },
  { label: "Ngăn đông", value: "FREEZER" },
  { label: "Tủ đồ khô", value: "DRY" },
];

const specificLocationOptions: SelectOption[] = [
  { label: "Kệ trên", value: "TOP_SHELF" },
  { label: "Kệ giữa", value: "MIDDLE_SHELF" },
  { label: "Kệ dưới", value: "BOTTOM_SHELF" },
  { label: "Ngăn rau củ", value: "VEGETABLE_DRAWER" },
  { label: "Ngăn trái cây", value: "FRUIT_DRAWER" },
  { label: "Cánh tủ", value: "DOOR_SHELF" },
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

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const isOtherFoodName = (foodName?: string, categoryName?: string) => {
  const normalizedName = normalizeSearchText(foodName || "");
  const normalizedCategory = normalizeSearchText(categoryName || "");

  return (
    Boolean(normalizedName && normalizedName.endsWith(" khac")) ||
    Boolean(normalizedName && normalizedCategory && normalizedName === `${normalizedCategory} khac`)
  );
};

const isOtherFood = (food: Pick<FoodFromApi, "name" | "categoryName"> | null) =>
  Boolean(food && isOtherFoodName(food.name, food.categoryName));

const getFoodName = (food: FridgeItemFromApi) => {
  const isOther = isOtherFoodName(food.standardFoodName, food.categoryName);

  if (isOther) {
    return food.customName?.trim() || food.displayName?.trim() || food.standardFoodName || "Thực phẩm";
  }

  return food.standardFoodName?.trim() || food.displayName?.trim() || food.customName?.trim() || "Thực phẩm";
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

const formatQuantityInput = (value: number) =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));

const getInitialCustomName = (food: FridgeItemFromApi) => {
  if (food.customName?.trim()) return food.customName.trim();
  if (isOtherFoodName(food.standardFoodName, food.categoryName) && food.displayName !== food.standardFoodName) {
    return food.displayName?.trim() || "";
  }
  return "";
};

const createInitialSelectedFood = (food: FridgeItemFromApi): FoodFromApi => ({
  id: food.foodId,
  name: food.standardFoodName || food.displayName || "Thực phẩm",
  unit: food.unit,
  categoryId: food.categoryId,
  categoryName: food.categoryName,
});

const createInitialEditForm = (food: FridgeItemFromApi): EditFormState => {
  const selectedFood = createInitialSelectedFood(food);

  return {
    foodName: selectedFood.name,
    selectedFood,
    customName: getInitialCustomName(food),
    quantity: formatQuantityInput(Number(food.quantity)),
    storageLocation: food.storageLocation || "COOL",
    specificLocation: food.specificLocation || "",
    addedDate: food.addedDate || "",
    expiryDate: food.expiryDate || "",
    note: food.note || "",
  };
};

const FoodDetailPopup: React.FC<FoodDetailPopupProps> = ({
  food,
  onClose,
  onSaveFoodDetails,
  onRemoveFood,
  onAddToShoppingPlan,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(() => createInitialEditForm(food));
  const [allFoods, setAllFoods] = useState<FoodFromApi[]>([]);
  const [foodSuggestions, setFoodSuggestions] = useState<FoodFromApi[]>([]);
  const [isSearchingFoods, setIsSearchingFoods] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [removeReason, setRemoveReason] = useState<RemoveReasonCode | "">("");
  const [customRemoveReason, setCustomRemoveReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const selectedEditFood = editForm.selectedFood;
  const shouldShowCustomName = isOtherFood(selectedEditFood);
  const hasTypedFoodName = editForm.foodName.trim().length > 0;
  const showOtherFoodChoices = hasTypedFoodName && !isSearchingFoods && foodSuggestions.length === 0;
  const daysLeft = getDaysLeft(food.expiryDate);
  const expiryStatusClass = getExpiryStatusClass(daysLeft);
  const quantityValue = Number(editForm.quantity);
  const quantityIsValid = Number.isFinite(quantityValue) && quantityValue > 0;
  const activeUnit = selectedEditFood?.unit || food.unit || "";
  const step = activeUnit === "g" ? 50 : 1;
  const minQuantity = step === 50 ? 0 : 1;
  const isConfirmDisabled = !removeReason || (removeReason === "OTHER" && !customRemoveReason.trim());

  const otherFoodsByCategory = useMemo(() => {
    const grouped = new Map<string, FoodFromApi[]>();

    allFoods.filter(isOtherFood).forEach((item) => {
      const categoryName = item.categoryName || "Danh mục khác";
      grouped.set(categoryName, [...(grouped.get(categoryName) || []), item]);
    });

    return Array.from(grouped.entries());
  }, [allFoods]);

  useEffect(() => {
    if (!isEditing || allFoods.length > 0) return;

    const loadFoods = async () => {
      try {
        const response = await api.get<FoodFromApi[]>("/api/foods");
        setAllFoods(response.data);
      } catch {
        setAllFoods([]);
      }
    };

    loadFoods();
  }, [allFoods.length, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setFoodSuggestions([]);
      setIsSearchingFoods(false);
      return;
    }

    const keyword = editForm.foodName.trim();

    if (!keyword || editForm.selectedFood?.name === editForm.foodName) {
      setFoodSuggestions([]);
      setIsSearchingFoods(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingFoods(true);

      try {
        const response = await api.get<FoodFromApi[]>("/api/foods", {
          params: { keyword },
        });
        setFoodSuggestions(response.data.filter((item) => !isOtherFood(item)));
      } catch {
        setFoodSuggestions([]);
      } finally {
        setIsSearchingFoods(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [editForm.foodName, editForm.selectedFood?.name, isEditing]);

  const updateEditForm = (nextValues: Partial<EditFormState>) => {
    setEditForm((current) => ({ ...current, ...nextValues }));
    setActionError("");
  };

  const handleFoodNameChange = (value: string) => {
    updateEditForm({
      foodName: value,
      selectedFood: null,
      customName: "",
    });
  };

  const handleSelectFood = (nextFood: FoodFromApi) => {
    updateEditForm({
      foodName: nextFood.name,
      selectedFood: nextFood,
      customName: isOtherFood(nextFood) ? editForm.foodName.trim() : "",
    });
    setFoodSuggestions([]);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(createInitialEditForm(food));
    setFoodSuggestions([]);
    setActionError("");
  };

  const handleDecrease = () => {
    const current = Number.isFinite(quantityValue) ? quantityValue : 0;
    updateEditForm({ quantity: formatQuantityInput(Math.max(minQuantity, current - step)) });
  };

  const handleIncrease = () => {
    const current = Number.isFinite(quantityValue) ? quantityValue : 0;
    updateEditForm({ quantity: formatQuantityInput(current + step) });
  };

  const handleQuantityInputChange = (raw: string) => {
    if (raw === "" || /^\d*([.,]\d{0,2})?$/.test(raw)) {
      updateEditForm({ quantity: raw.replace(",", ".") });
    }
  };

  const handleQuantityInputBlur = () => {
    if (!quantityIsValid) {
      updateEditForm({ quantity: formatQuantityInput(Math.max(minQuantity || 1, 1)) });
    } else {
      updateEditForm({ quantity: formatQuantityInput(quantityValue) });
    }
  };

  const validateEditForm = () => {
    if (!selectedEditFood) {
      return "Vui lòng chọn thực phẩm từ danh sách gợi ý.";
    }

    if (shouldShowCustomName && !editForm.customName.trim()) {
      return "Vui lòng nhập tên thực phẩm cụ thể.";
    }

    if (!quantityIsValid) {
      return "Số lượng phải lớn hơn 0.";
    }

    if (!editForm.storageLocation) {
      return "Vui lòng chọn vị trí chính.";
    }

    if (!editForm.expiryDate) {
      return "Vui lòng chọn hạn sử dụng.";
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validateEditForm();

    if (validationError) {
      setActionError(validationError);
      return;
    }

    if (!selectedEditFood) return;

    setIsSaving(true);
    setActionError("");

    try {
      await onSaveFoodDetails(food.id, {
        foodId: selectedEditFood.id,
        customName: shouldShowCustomName ? editForm.customName.trim() : "",
        quantity: quantityValue,
        storageLocation: editForm.storageLocation,
        specificLocation: editForm.specificLocation || "",
        addedDate: editForm.addedDate || null,
        expiryDate: editForm.expiryDate,
        note: editForm.note.trim() || "",
      });
    } catch {
      setActionError("Không lưu được thay đổi.");
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
            <div className="food-detail-section-title-row">
              <h3>Thông tin chi tiết</h3>
              {!isEditing && (
                <button
                  type="button"
                  className="food-detail-edit-button"
                  onClick={() => setIsEditing(true)}
                  aria-label="Chỉnh sửa thông tin thực phẩm"
                  title="Chỉnh sửa"
                >
                  <PencilLine size={16} strokeWidth={2.4} />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="food-detail-edit-form">
                <label className={`food-detail-field ${shouldShowCustomName ? "" : "wide"} food-detail-food-search`}>
                  <span>
                    Tên thực phẩm <strong>*</strong>
                  </span>
                  <input
                    type="text"
                    value={editForm.foodName}
                    onChange={(event) => handleFoodNameChange(event.target.value)}
                    placeholder="Nhập tên thực phẩm"
                    autoComplete="off"
                    disabled={isSaving}
                  />

                  {hasTypedFoodName && !selectedEditFood && (
                    <div className="food-detail-food-suggestions">
                      {isSearchingFoods && <p className="food-detail-suggestion-state">Đang tìm thực phẩm...</p>}

                      {!isSearchingFoods &&
                        foodSuggestions.map((suggestion) => (
                          <button type="button" key={suggestion.id} onClick={() => handleSelectFood(suggestion)}>
                            <strong>{suggestion.name}</strong>
                            <span>
                              {suggestion.categoryName || "Chưa có danh mục"}
                              {suggestion.unit ? ` · ${suggestion.unit}` : ""}
                            </span>
                          </button>
                        ))}

                      {showOtherFoodChoices && (
                        <div className="food-detail-other-foods">
                          <p>Không có thực phẩm khớp. Chọn nhóm thực phẩm phù hợp:</p>
                          {otherFoodsByCategory.map(([categoryName, items]) => (
                            <div className="food-detail-other-category" key={categoryName}>
                              <span>{categoryName}</span>
                              <div>
                                {items.map((item) => (
                                  <button type="button" key={item.id} onClick={() => handleSelectFood(item)}>
                                    {item.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </label>

                {shouldShowCustomName && (
                  <Field
                    label="Tên thực phẩm cụ thể"
                    required
                    value={editForm.customName}
                    onChange={(value) => updateEditForm({ customName: value })}
                    placeholder="Nhập tên thực phẩm cụ thể"
                    disabled={isSaving}
                  />
                )}

                <Field
                  label="Danh mục"
                  value={selectedEditFood?.categoryName || ""}
                  placeholder="Chọn thực phẩm trước"
                  disabled
                />
                <Field
                  label="Ngày nhập"
                  type="date"
                  value={editForm.addedDate}
                  onChange={(value) => updateEditForm({ addedDate: value })}
                  disabled={isSaving}
                />
                <Field
                  label="Hạn sử dụng"
                  required
                  type="date"
                  value={editForm.expiryDate}
                  onChange={(value) => updateEditForm({ expiryDate: value })}
                  disabled={isSaving}
                />
                <Field
                  label="Vị trí chính"
                  required
                  as="select"
                  options={storageLocationOptions}
                  value={editForm.storageLocation}
                  onChange={(value) => updateEditForm({ storageLocation: value as StorageLocation })}
                  disabled={isSaving}
                />
                <Field
                  label="Vị trí cụ thể"
                  as="select"
                  options={specificLocationOptions}
                  value={editForm.specificLocation}
                  onChange={(value) => updateEditForm({ specificLocation: value })}
                  placeholder="Chọn vị trí cụ thể"
                  disabled={isSaving}
                />
                <Field
                  label="Ghi chú"
                  value={editForm.note}
                  onChange={(value) => updateEditForm({ note: value })}
                  placeholder="Nhập ghi chú nếu có"
                  wide
                  multiline
                  disabled={isSaving}
                />

                <div className="food-detail-edit-quantity-block">
                  <span>Số lượng và đơn vị</span>
                  <div className="food-detail-quantity-row">
                    <button onClick={handleDecrease} aria-label="Giảm số lượng" disabled={isSaving}>
                      <img src={iconMinus} alt="" className="food-detail-quantity-icon" />
                    </button>

                    <input
                      className="food-detail-quantity-value"
                      type="text"
                      inputMode="decimal"
                      value={editForm.quantity}
                      onChange={(event) => handleQuantityInputChange(event.target.value)}
                      onBlur={handleQuantityInputBlur}
                      aria-label="Nhập số lượng"
                      disabled={isSaving}
                    />

                    <div className="food-detail-unit" aria-label="Đơn vị">
                      {activeUnit || "Đơn vị"}
                    </div>

                    <button onClick={handleIncrease} aria-label="Tăng số lượng" disabled={isSaving}>
                      <img src={iconPlus} alt="" className="food-detail-quantity-icon" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </section>

          {!isEditing && (
            <>
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

              {onAddToShoppingPlan && (
                <button
                  type="button"
                  className="food-detail-add-shopping"
                  onClick={() => onAddToShoppingPlan(food)}
                  disabled={isSaving}
                >
                  <img src={iconShopping} alt="" />
                  Thêm vào Kế hoạch đi chợ
                </button>
              )}

              <section className="food-detail-section">
                <h3>Hướng dẫn bảo quản</h3>

                <div className="food-detail-storage-box">
                  {(food.preservationMethods?.length
                    ? food.preservationMethods
                    : ["Chưa có hướng dẫn bảo quản cho thực phẩm này."]
                  ).map((method) => (
                    <div className="food-detail-tip" key={method}>
                      <img src={iconInfo} alt="" />
                      <span>{method}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {actionError && <p className="food-detail-action-error">{actionError}</p>}

          {isEditing ? (
            <div className="food-detail-action-row">
              <button className="food-detail-cancel-button" onClick={handleCancelEdit} disabled={isSaving}>
                Hủy
              </button>

              <button className="food-detail-save-button" onClick={handleSave} disabled={isSaving || !quantityIsValid}>
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          ) : (
            <section className="food-detail-remove-section">
              <button className="food-detail-remove-button" onClick={() => setIsRemoveConfirmOpen(true)} disabled={isSaving}>
                <img src={iconAlert} alt="" />
                Loại khỏi tủ lạnh
              </button>

              <p>Thực phẩm sẽ được loại khỏi danh sách hiện tại.</p>
            </section>
          )}
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

type FieldProps = {
  label: string;
  required?: boolean;
  value?: string;
  placeholder?: string;
  type?: string;
  as?: "input" | "select";
  options?: Array<string | SelectOption>;
  wide?: boolean;
  multiline?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

const getOptionValue = (option: string | SelectOption) => (typeof option === "string" ? option : option.value);
const getOptionLabel = (option: string | SelectOption) => (typeof option === "string" ? option : option.label);

const Field: React.FC<FieldProps> = ({
  label,
  required,
  value,
  placeholder,
  type = "text",
  as = "input",
  options = [],
  wide,
  multiline,
  disabled,
  onChange,
}) => {
  return (
    <label className={`food-detail-field ${wide ? "wide" : ""} ${multiline ? "multiline" : ""}`}>
      <span>
        {label} {required && <strong>*</strong>}
      </span>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      ) : as === "select" ? (
        <select value={value || ""} onChange={(event) => onChange?.(event.target.value)} disabled={disabled}>
          <option value="">{placeholder || `Chọn ${label.toLowerCase()}`}</option>
          {options.map((option) => (
            <option key={getOptionValue(option)} value={getOptionValue(option)}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "0.01" : undefined}
        />
      )}
    </label>
  );
};

export default FoodDetailPopup;
