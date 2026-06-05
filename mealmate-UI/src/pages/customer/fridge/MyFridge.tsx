import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./MyFridge.css";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import api from "@/services/api";

import AddFoodToFridgeScreen from "./AddFoodToFridgeScreen";
import FoodDetailPopup from "./FoodDetailPopup";

import iconAlert from "@/assets/icon/Icon-alert.svg";
import iconArrow from "@/assets/icon/Icon-arrow.svg";
import iconBox from "@/assets/icon/Icon-box.svg";
import iconClock from "@/assets/icon/Icon-clock.svg";
import iconPlus from "@/assets/icon/Icon-plus.svg";
import iconRecipe from "@/assets/icon/Icon-recipe.svg";
import angryFridgeIcon from "@/assets/icon/angry-fridge.svg";
import happyFridgeIcon from "@/assets/icon/happy-fridge.svg";
import neutralFridgeIcon from "@/assets/icon/neutral-fridge.svg";

type StorageLocation = "COOL" | "FREEZER" | "DRY";
type FridgeItemStatus = "STORED" | "EXPIRED" | "USED" | "REMOVED";
type FilterMode = "LOCATION" | "CATEGORY";

export type RemoveReasonCode =
  | "USED_UP"
  | "EXPIRED_DISCARDED"
  | "SPOILED"
  | "WRONG_INFO"
  | "OTHER";

export type FridgeItemFromApi = {
  id: number;
  familyId: number;
  foodId: number;
  standardFoodName?: string;
  displayName?: string;
  unit?: string;
  categoryId?: number;
  categoryName?: string;
  categoryIconKey?: string;
  categoryColorCode?: string;
  preservationMethods?: string[];
  quantity: number;
  storageLocation?: StorageLocation;
  specificLocation?: string;
  addedDate?: string;
  expiryDate?: string;
  status: FridgeItemStatus;
  imageUrl?: string;
  note?: string;
};

type CategoryFromApi = {
  id: number;
  name: string;
  iconKey?: string;
  colorCode?: string;
};

type FridgeOverviewFromApi = {
  totalStored: number;
  expiredCount: number;
  expiringSoonCount: number;
  almostOutCount: number;
  status: "EMPTY" | "HAPPY" | "NEEDS_ATTENTION";
};

type RecipeSuggestionIngredientFromApi = {
  foodId: number;
  foodName: string;
  requiredQuantity?: number;
  requiredUnit?: string;
  availableQuantity?: number;
  availableUnit?: string;
  sufficientQuantity: boolean;
  expiringSoon: boolean;
  nearestExpiryDate?: string;
};

type RecipeSuggestionFromApi = {
  recipeId: number;
  name: string;
  imageUrl?: string;
  instructions?: string;
  preferredMealTime?: string;
  score: number;
  coveragePercent: number;
  canCook: boolean;
  matchedIngredients: RecipeSuggestionIngredientFromApi[];
  missingIngredients: RecipeSuggestionIngredientFromApi[];
  expiringIngredients: RecipeSuggestionIngredientFromApi[];
};

type ToastState = {
  message: string;
  variant: "success" | "danger";
};

type AlertType = "expiring" | "expired" | "almostOut";

const emptyFridgeOverview: FridgeOverviewFromApi = {
  totalStored: 0,
  expiredCount: 0,
  expiringSoonCount: 0,
  almostOutCount: 0,
  status: "EMPTY",
};

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

const getFoodName = (item: FridgeItemFromApi) => {
  return item.displayName || item.standardFoodName || "Thực phẩm";
};

const getFoodIcon = (item: FridgeItemFromApi) => {
  const iconKey = item.categoryIconKey || "default_food";
  return foodIconMap[iconKey] || foodIconMap.default_food;
};

const getFoodIconBg = (item: FridgeItemFromApi) => {
  return item.categoryColorCode || "#F1F5F9";
};

const getStorageLocationText = (storageLocation?: StorageLocation) => {
  if (!storageLocation) return "Chưa phân loại";
  return storageLocationLabelMap[storageLocation] || storageLocation;
};

const getSpecificLocationText = (specificLocation?: string) => {
  if (!specificLocation) return "";
  return specificLocationLabelMap[specificLocation] || specificLocation;
};

const getQuantityText = (item: FridgeItemFromApi) => {
  return `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`;
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

const getExpiryState = (daysLeft: number | null) => {
  if (daysLeft === null) return "safe";
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 3) return "expiring";
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

const getAlmostOutThreshold = (unit?: string) => {
  const normalizedUnit = (unit || "").trim().toLowerCase();

  if (normalizedUnit === "g") return 100;
  if (normalizedUnit === "kg") return 0.1;
  if (normalizedUnit === "ml") return 200;
  if (["l", "lit", "lít"].includes(normalizedUnit)) return 0.2;
  if (normalizedUnit === "quả") return 2;
  if (["hộp", "gói", "chai", "lon", "cái", "bó"].includes(normalizedUnit)) return 1;
  return 1;
};

const isAlmostOut = (item: FridgeItemFromApi) => {
  return Number(item.quantity) <= getAlmostOutThreshold(item.unit);
};

const getAlertTitle = (type: AlertType) => {
  if (type === "expired") return "Thực phẩm đã hết hạn";
  if (type === "expiring") return "Thực phẩm sắp hết hạn";
  return "Thực phẩm sắp hết";
};

const getAlertDescription = (type: AlertType) => {
  if (type === "expired") return "Kiểm tra và xử lý các thực phẩm đã quá hạn sử dụng.";
  if (type === "expiring") return "Ưu tiên dùng các thực phẩm còn hạn trong 3 ngày tới.";
  return "Bổ sung hoặc lên kế hoạch mua thêm các thực phẩm sắp hết.";
};

const getAlertEmptyText = (type: AlertType) => {
  if (type === "expired") return "Không có thực phẩm đã hết hạn.";
  if (type === "expiring") return "Không có thực phẩm sắp hết hạn.";
  return "Không có thực phẩm sắp hết số lượng.";
};

const formatSuggestionQuantity = (quantity?: number, unit?: string) => {
  if (quantity === undefined || quantity === null) return "Chưa có";
  const formattedQuantity = Number.isInteger(quantity) ? String(quantity) : String(Number(quantity.toFixed(2)));
  return `${formattedQuantity}${unit ? ` ${unit}` : ""}`;
};

const getMealTimeText = (mealTime?: string) => {
  if (mealTime === "BREAKFAST") return "Bữa sáng";
  if (mealTime === "LUNCH") return "Bữa trưa";
  if (mealTime === "DINNER") return "Bữa tối";
  return "Linh hoạt";
};

const MyFridge: React.FC = () => {
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [fridgeItems, setFridgeItems] = useState<FridgeItemFromApi[]>([]);
  const [fridgeOverview, setFridgeOverview] = useState<FridgeOverviewFromApi>(emptyFridgeOverview);
  const [categories, setCategories] = useState<CategoryFromApi[]>([]);
  const [selectedFood, setSelectedFood] = useState<FridgeItemFromApi | null>(null);
  const [keyword, setKeyword] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("LOCATION");
  const [activeLocation, setActiveLocation] = useState<StorageLocation | "ALL">("ALL");
  const [activeCategoryId, setActiveCategoryId] = useState<number | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activeAlertType, setActiveAlertType] = useState<AlertType | null>(null);
  const [alertItems, setAlertItems] = useState<FridgeItemFromApi[]>([]);
  const [isAlertLoading, setIsAlertLoading] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [recipeSuggestions, setRecipeSuggestions] = useState<RecipeSuggestionFromApi[]>([]);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<number | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get<CategoryFromApi[]>("/api/categories");
        setCategories(response.data);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const loadFridgeOverview = useCallback(async () => {
    try {
      const response = await api.get<FridgeOverviewFromApi>("/api/fridge-items/overview");
      setFridgeOverview(response.data);
    } catch {
      setFridgeOverview(emptyFridgeOverview);
    }
  }, []);

  useEffect(() => {
    loadFridgeOverview();
  }, [loadFridgeOverview]);

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await api.get<FridgeItemFromApi[]>("/api/fridge-items", {
          params: {
            keyword: keyword.trim() || undefined,
            categoryId: filterMode === "CATEGORY" && activeCategoryId !== "ALL" ? activeCategoryId : undefined,
          },
        });
        setFridgeItems(response.data);
      } catch {
        setErrorMessage("Không tải được dữ liệu tủ lạnh.");
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [activeCategoryId, filterMode, keyword, refreshKey]);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const visibleItems = useMemo(() => {
    if (filterMode === "CATEGORY") return fridgeItems;
    if (activeLocation === "ALL") return fridgeItems;
    return fridgeItems.filter((item) => item.storageLocation === activeLocation);
  }, [activeLocation, filterMode, fridgeItems]);

  const categoryFilters = useMemo(() => {
    if (categories.length > 0) return categories;

    const byId = new Map<number, CategoryFromApi>();
    fridgeItems.forEach((item) => {
      if (!item.categoryId || byId.has(item.categoryId)) return;

      byId.set(item.categoryId, {
        id: item.categoryId,
        name: item.categoryName || "Danh mục",
        iconKey: item.categoryIconKey,
        colorCode: item.categoryColorCode,
      });
    });

    return Array.from(byId.values());
  }, [categories, fridgeItems]);

  const visibleAlertItems = useMemo(() => {
    if (!activeAlertType) return [];

    return alertItems.filter((item) => {
      const daysLeft = getDaysLeft(item.expiryDate);

      if (activeAlertType === "expired") {
        return daysLeft !== null && daysLeft < 0;
      }

      if (activeAlertType === "expiring") {
        return daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
      }

      return isAlmostOut(item);
    });
  }, [activeAlertType, alertItems]);

  const handleFilterModeChange = (nextMode: FilterMode) => {
    setFilterMode(nextMode);
    if (nextMode === "LOCATION") {
      setActiveCategoryId("ALL");
    } else {
      setActiveLocation("ALL");
    }
  };

  const handleOpenAlert = async (type: AlertType) => {
    setActiveAlertType(type);
    setIsAlertLoading(true);

    try {
      const response = await api.get<FridgeItemFromApi[]>("/api/fridge-items");
      setAlertItems(response.data);
    } catch {
      setAlertItems([]);
    } finally {
      setIsAlertLoading(false);
    }
  };

  const handleSelectAlertItem = (item: FridgeItemFromApi) => {
    setActiveAlertType(null);
    setSelectedFood(item);
  };

  const handleOpenSuggestions = async () => {
    setIsSuggestionOpen(true);
    setIsSuggestionLoading(true);
    setSuggestionError("");
    setExpandedSuggestionId(null);

    try {
      const response = await api.get<RecipeSuggestionFromApi[]>("/api/fridge-items/recipe-suggestions", {
        params: { limit: 10 },
      });
      setRecipeSuggestions(response.data);
    } catch {
      setRecipeSuggestions([]);
      setSuggestionError("Không tải được danh sách món ăn gợi ý.");
    } finally {
      setIsSuggestionLoading(false);
    }
  };

  const totalFridgeItemsCount = fridgeOverview.totalStored;

  const expiringItemsCount = fridgeOverview.expiringSoonCount;

  const expiredItemsCount = fridgeOverview.expiredCount;

  const almostOutCount = fridgeOverview.almostOutCount;
  const fridgeStatus = useMemo(() => {
    if (fridgeOverview.status === "EMPTY") {
      return {
        icon: neutralFridgeIcon,
        title: "Tủ lạnh của bạn đang chờ thực phẩm...",
        description: "Nhấn dấu “+” bên dưới để thêm thực phẩm đầu tiên.",
      };
    }

    if (fridgeOverview.status === "NEEDS_ATTENTION") {
      return {
        icon: angryFridgeIcon,
        title: "Tủ lạnh của bạn cần chú ý!",
        description: "Hãy kiểm tra lại các thực phẩm có thể hết hạn hoặc sắp hết.",
      };
    }

    return {
      icon: happyFridgeIcon,
      title: "Tủ lạnh của bạn đang hạnh phúc!",
      description: "Tất cả thực phẩm đều tươi ngon và đầy đủ.",
    };
  }, [fridgeOverview.status]);

  const handleSaveQuantity = async (fridgeItemId: number, newQuantityValue: number) => {
    const response = await api.patch<FridgeItemFromApi>(`/api/fridge-items/${fridgeItemId}`, {
      quantity: newQuantityValue,
    });

    setFridgeItems((prevItems) =>
      prevItems.map((item) => (item.id === fridgeItemId ? { ...item, ...response.data } : item))
    );
    await loadFridgeOverview();
    setSelectedFood(null);
    setToast({ message: "Đã cập nhật thực phẩm trong tủ lạnh.", variant: "success" });
  };

  const handleRemoveFood = async (
    fridgeItemId: number,
    removedReason: RemoveReasonCode,
    removedReasonNote?: string
  ) => {
    await api.patch<FridgeItemFromApi>(`/api/fridge-items/${fridgeItemId}/remove`, {
      removedReason,
      removedReasonNote,
    });

    setFridgeItems((prevItems) => prevItems.filter((item) => item.id !== fridgeItemId));
    await loadFridgeOverview();
    setSelectedFood(null);
    setToast({ message: "Đã loại thực phẩm khỏi tủ lạnh.", variant: "success" });
  };

  const handleFoodAdded = () => {
    setRefreshKey((current) => current + 1);
    loadFridgeOverview();
    setIsAddingFood(false);
    setToast({ message: "Đã thêm thực phẩm vào tủ lạnh.", variant: "success" });
  };

  return (
    <div className="my-fridge-layout">
      <Sidebar />

      <div className="my-fridge-page">
        <Topbar
          searchPlaceholder="Tìm kiếm thực phẩm..."
          searchValue={keyword}
          onSearchChange={setKeyword}
        />

        {isAddingFood ? (
          <AddFoodToFridgeScreen onCancel={() => setIsAddingFood(false)} onAdded={handleFoodAdded} />
        ) : (
          <div className="my-fridge">
          <div className="my-fridge-content">
            <main className="my-fridge-main">
              <div className="my-fridge-toolbar">
                <div className="my-fridge-view-tabs">
                  <button
                    className={filterMode === "LOCATION" ? "active" : ""}
                    onClick={() => handleFilterModeChange("LOCATION")}
                  >
                    Theo vị trí
                  </button>
                  <button
                    className={filterMode === "CATEGORY" ? "active" : ""}
                    onClick={() => handleFilterModeChange("CATEGORY")}
                  >
                    Theo thực phẩm
                  </button>
                </div>

              </div>

              <div className="my-fridge-filter-tabs">
                {filterMode === "LOCATION" ? (
                  <>
                    <button className={activeLocation === "ALL" ? "active" : ""} onClick={() => setActiveLocation("ALL")}>
                      Tất cả
                    </button>
                    <button className={activeLocation === "COOL" ? "active" : ""} onClick={() => setActiveLocation("COOL")}>
                      Ngăn mát
                    </button>
                    <button
                      className={activeLocation === "FREEZER" ? "active" : ""}
                      onClick={() => setActiveLocation("FREEZER")}
                    >
                      Ngăn đông
                    </button>
                    <button className={activeLocation === "DRY" ? "active" : ""} onClick={() => setActiveLocation("DRY")}>
                      Tủ đồ khô
                    </button>
                  </>
                ) : (
                  <>
                    <button className={activeCategoryId === "ALL" ? "active" : ""} onClick={() => setActiveCategoryId("ALL")}>
                      Tất cả
                    </button>
                    {categoryFilters.map((category) => (
                      <button
                        key={category.id}
                        className={activeCategoryId === category.id ? "active" : ""}
                        onClick={() => setActiveCategoryId(category.id)}
                      >
                        <span
                          className="my-fridge-category-icon"
                          style={{ backgroundColor: category.colorCode || "#F1F5F9" }}
                        >
                          {foodIconMap[category.iconKey || "default_food"] || foodIconMap.default_food}
                        </span>
                        {category.name}
                      </button>
                    ))}
                  </>
                )}
              </div>

              {errorMessage && <div className="my-fridge-state error">{errorMessage}</div>}
              {isLoading && <div className="my-fridge-state">Đang tải dữ liệu tủ lạnh...</div>}
              {!isLoading && !errorMessage && visibleItems.length === 0 && (
                <div className="my-fridge-state">Chưa có thực phẩm phù hợp.</div>
              )}

              <section className="my-fridge-grid">
                {visibleItems.map((item) => {
                  const daysLeft = getDaysLeft(item.expiryDate);
                  const expiryState = getExpiryState(daysLeft);
                  const itemAlmostOut = isAlmostOut(item);
                  const specificLocationText = getSpecificLocationText(item.specificLocation);

                  return (
                    <article
                      className={`my-fridge-card ${expiryState !== "safe" ? "expiry-alert" : ""} ${
                        itemAlmostOut ? "stock-alert" : ""
                      }`}
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedFood(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") setSelectedFood(item);
                      }}
                    >
                      <div className="my-fridge-card-top">
                        <div className="my-fridge-food-icon" style={{ backgroundColor: getFoodIconBg(item) }}>
                          {getFoodIcon(item)}
                        </div>

                        <div className="my-fridge-food-info">
                          <h3>{getFoodName(item)}</h3>
                          <p>{getQuantityText(item)}</p>
                        </div>
                      </div>

                      {(expiryState !== "safe" || itemAlmostOut) && (
                        <div className="my-fridge-card-badges">
                          {expiryState === "expired" && (
                            <span className="fridge-item-badge danger" title="Đã hết hạn" aria-label="Đã hết hạn">
                              <img src={iconAlert} alt="" />
                            </span>
                          )}
                          {expiryState === "expiring" && (
                            <span className="fridge-item-badge danger" title="Sắp hết hạn" aria-label="Sắp hết hạn">
                              <img src={iconClock} alt="" />
                            </span>
                          )}
                          {itemAlmostOut && (
                            <span className="fridge-item-badge warning" title="Sắp hết" aria-label="Sắp hết">
                              <img src={iconBox} alt="" />
                            </span>
                          )}
                        </div>
                      )}

                      <div className="my-fridge-food-meta">
                        <p>
                          <strong>{getStorageLocationText(item.storageLocation)}</strong>
                          {specificLocationText && <span> • {specificLocationText}</span>}
                        </p>
                        <p className="expiry-date">HSD: {formatDateToDisplay(item.expiryDate)}</p>
                      </div>

                      <div className="my-fridge-progress-area">
                        <p>{getDaysLeftLabel(daysLeft)}</p>
                        <div
                          className="my-fridge-progress-track"
                          style={{ backgroundColor: getProgressTrackColor(daysLeft) }}
                        >
                          <div
                            className="my-fridge-progress-bar"
                            style={{
                              width: getProgressWidth(item.addedDate, item.expiryDate),
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
              <section className="fridge-status-card">
                <h2>Trạng thái tủ lạnh</h2>
                <div className="fridge-status-body">
                  <div className="fridge-status-visual" aria-hidden="true">
                    <img src={fridgeStatus.icon} alt="" />
                  </div>

                  <div className="fridge-status-copy">
                    <h3>{fridgeStatus.title}</h3>
                    <p>{fridgeStatus.description}</p>
                  </div>
                </div>

                <div className="fridge-status-total-pill">
                  <strong>{totalFridgeItemsCount}</strong>
                  <span>thực phẩm</span>
                </div>
              </section>

              <section className="my-fridge-alerts">
                <button className="alert-card danger" onClick={() => handleOpenAlert("expiring")}>
                  <img src={iconAlert} alt="" className="alert-icon" />
                  <span>{expiringItemsCount} thực phẩm sắp hết hạn</span>
                  <img src={iconArrow} alt="" className="alert-arrow" />
                </button>

                <button className="alert-card neutral" onClick={() => handleOpenAlert("expired")}>
                  <img src={iconClock} alt="" className="alert-icon" />
                  <span>{expiredItemsCount} thực phẩm đã hết hạn</span>
                  <img src={iconArrow} alt="" className="alert-arrow" />
                </button>

                <button className="alert-card success" onClick={() => handleOpenAlert("almostOut")}>
                  <img src={iconBox} alt="" className="alert-icon" />
                  <span>{almostOutCount} thực phẩm sắp hết</span>
                  <img src={iconArrow} alt="" className="alert-arrow" />
                </button>
              </section>

              <section className="my-fridge-actions">
                <button className="round-action add" aria-label="Thêm thực phẩm" onClick={() => setIsAddingFood(true)}>
                  <img src={iconPlus} alt="" />
                  <span>Thêm thực phẩm</span>
                </button>
                <button className="round-action suggest" aria-label="Gợi ý món ăn" onClick={handleOpenSuggestions}>
                  <img src={iconRecipe} alt="" />
                  <span>Gợi ý món ăn</span>
                </button>
              </section>
            </aside>
          </div>
          </div>
        )}
      </div>

      {selectedFood && (
        <FoodDetailPopup
          key={selectedFood.id}
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
          onSaveQuantity={handleSaveQuantity}
          onRemoveFood={handleRemoveFood}
        />
      )}

      {activeAlertType && (
        <div className="fridge-alert-overlay" onClick={() => setActiveAlertType(null)}>
          <section className="fridge-alert-dialog" onClick={(event) => event.stopPropagation()}>
            <header className="fridge-alert-dialog-header">
              <div>
                <h2>{getAlertTitle(activeAlertType)}</h2>
                <p>{getAlertDescription(activeAlertType)}</p>
              </div>
              <button type="button" onClick={() => setActiveAlertType(null)} aria-label="Đóng cảnh báo">
                ×
              </button>
            </header>

            <div className="fridge-alert-list">
              {isAlertLoading && <div className="fridge-alert-empty">Đang tải danh sách cảnh báo...</div>}

              {!isAlertLoading && visibleAlertItems.length === 0 && (
                <div className="fridge-alert-empty">{getAlertEmptyText(activeAlertType)}</div>
              )}

              {!isAlertLoading &&
                visibleAlertItems.map((item) => {
                  const daysLeft = getDaysLeft(item.expiryDate);

                  return (
                    <button
                      className="fridge-alert-item"
                      type="button"
                      key={item.id}
                      onClick={() => handleSelectAlertItem(item)}
                    >
                      <span className="fridge-alert-item-icon" style={{ backgroundColor: getFoodIconBg(item) }}>
                        {getFoodIcon(item)}
                      </span>
                      <span className="fridge-alert-item-main">
                        <strong>{getFoodName(item)}</strong>
                        <span>
                          {getQuantityText(item)} · {getDaysLeftLabel(daysLeft)}
                        </span>
                      </span>
                      <img src={iconArrow} alt="" />
                    </button>
                  );
                })}
            </div>
          </section>
        </div>
      )}

      {isSuggestionOpen && (
        <div className="recipe-suggestion-overlay" onClick={() => setIsSuggestionOpen(false)}>
          <section className="recipe-suggestion-dialog" onClick={(event) => event.stopPropagation()}>
            <header className="recipe-suggestion-header">
              <div>
                <h2>Gợi ý món ăn</h2>
                <p>Ưu tiên công thức tận dụng thực phẩm đang có và sắp hết hạn trong tủ.</p>
              </div>
              <button type="button" onClick={() => setIsSuggestionOpen(false)} aria-label="Đóng gợi ý món ăn">
                ×
              </button>
            </header>

            {isSuggestionLoading && <div className="recipe-suggestion-state">Đang tìm món phù hợp...</div>}

            {!isSuggestionLoading && suggestionError && (
              <div className="recipe-suggestion-state error">{suggestionError}</div>
            )}

            {!isSuggestionLoading && !suggestionError && recipeSuggestions.length === 0 && (
              <div className="recipe-suggestion-state">
                Chưa có công thức phù hợp với thực phẩm hiện có trong tủ.
              </div>
            )}

            {!isSuggestionLoading && !suggestionError && recipeSuggestions.length > 0 && (
              <div className="recipe-suggestion-list">
                {recipeSuggestions.map((suggestion, index) => {
                  const isExpanded = expandedSuggestionId === suggestion.recipeId;

                  return (
                    <article className="recipe-suggestion-card" key={suggestion.recipeId}>
                      <div className="recipe-suggestion-card-main">
                        <div className="recipe-suggestion-rank">{index + 1}</div>
                        <div className="recipe-suggestion-info">
                          <div className="recipe-suggestion-title-row">
                            <h3>{suggestion.name}</h3>
                            <span className={suggestion.canCook ? "ready" : "partial"}>
                              {suggestion.canCook ? "Có thể nấu" : "Cần bổ sung"}
                            </span>
                          </div>
                          <p>
                            {suggestion.coveragePercent}% nguyên liệu có sẵn · {getMealTimeText(suggestion.preferredMealTime)}
                          </p>
                        </div>
                        <div className="recipe-suggestion-score">
                          <strong>{suggestion.score}</strong>
                          <span>điểm</span>
                        </div>
                      </div>

                      <div className="recipe-suggestion-tags">
                        <span>{suggestion.matchedIngredients.length} nguyên liệu đang có</span>
                        <span>{suggestion.missingIngredients.length} cần bổ sung</span>
                        {suggestion.expiringIngredients.length > 0 && (
                          <span className="urgent">{suggestion.expiringIngredients.length} sắp hết hạn</span>
                        )}
                      </div>

                      <div className="recipe-suggestion-ingredients">
                        <div>
                          <h4>Đang có</h4>
                          {suggestion.matchedIngredients.length > 0 ? (
                            suggestion.matchedIngredients.map((ingredient) => (
                              <p key={`matched-${suggestion.recipeId}-${ingredient.foodId}`}>
                                {ingredient.foodName}
                                <span>
                                  {formatSuggestionQuantity(ingredient.availableQuantity, ingredient.availableUnit)}
                                </span>
                              </p>
                            ))
                          ) : (
                            <p>Chưa có nguyên liệu phù hợp</p>
                          )}
                        </div>

                        <div>
                          <h4>Cần thêm</h4>
                          {suggestion.missingIngredients.length > 0 ? (
                            suggestion.missingIngredients.map((ingredient) => (
                              <p key={`missing-${suggestion.recipeId}-${ingredient.foodId}`}>
                                {ingredient.foodName}
                                <span>
                                  {formatSuggestionQuantity(ingredient.requiredQuantity, ingredient.requiredUnit)}
                                </span>
                              </p>
                            ))
                          ) : (
                            <p>Đã đủ nguyên liệu</p>
                          )}
                        </div>
                      </div>

                      {suggestion.expiringIngredients.length > 0 && (
                        <div className="recipe-suggestion-expiring">
                          Nên dùng sớm: {suggestion.expiringIngredients.map((ingredient) => ingredient.foodName).join(", ")}
                        </div>
                      )}

                      <button
                        className="recipe-suggestion-detail-toggle"
                        type="button"
                        onClick={() => setExpandedSuggestionId(isExpanded ? null : suggestion.recipeId)}
                      >
                        {isExpanded ? "Ẩn hướng dẫn" : "Xem hướng dẫn nấu"}
                      </button>

                      {isExpanded && (
                        <div className="recipe-suggestion-instructions">
                          {suggestion.instructions || "Chưa có hướng dẫn nấu cho món này."}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {toast && (
        <div className={`my-fridge-toast ${toast.variant}`} role="status">
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Đóng thông báo">
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default MyFridge;
