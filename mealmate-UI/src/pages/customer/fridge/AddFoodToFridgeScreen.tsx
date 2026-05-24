import React, { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import "./AddFoodToFridgeScreen.css";

type AddFoodMode = "SHOPPING_PLAN" | "MANUAL";
type ItemStatus = "selected" | "skipped";
type StorageLocation = "COOL" | "FREEZER" | "DRY";

type FoodFromApi = {
  id: number;
  categoryId?: number;
  categoryName?: string;
  name: string;
  unit?: string;
  synonyms?: string;
};

type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  selectedByDefault?: boolean;
  expanded?: boolean;
};

type ShoppingCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  items: ShoppingItem[];
};

type SelectOption = {
  label: string;
  value: string;
};

type ManualFormState = {
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

type AddFoodToFridgeScreenProps = {
  onCancel: () => void;
  onAdded?: () => void;
};

const shoppingCategories: ShoppingCategory[] = [
  {
    id: "dairy",
    name: "Trứng & Sữa",
    icon: "🥛",
    color: "#E5F5FF",
    items: [
      { id: "milk", name: "Sữa tươi nguyên chất", quantity: 2, unit: "L", selectedByDefault: true, expanded: true },
      { id: "egg", name: "Trứng gà ta", quantity: 10, unit: "quả", selectedByDefault: true, expanded: true },
    ],
  },
  {
    id: "meat",
    name: "Thịt",
    icon: "🥩",
    color: "#FFE5E5",
    items: [{ id: "beef", name: "Thịt bò thăn", quantity: 400, unit: "g" }],
  },
  {
    id: "seafood",
    name: "Hải sản",
    icon: "🦐",
    color: "#E5F5FF",
    items: [{ id: "shrimp", name: "Tôm sú tươi", quantity: 1, unit: "kg" }],
  },
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

const unitOptions = ["g", "kg", "ml", "L", "quả", "hộp", "gói"];

const getTodayInputValue = () => new Date().toISOString().slice(0, 10);

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const isOtherFood = (food: FoodFromApi) => {
  const normalizedName = normalizeSearchText(food.name);
  return normalizedName.endsWith(" khac") || normalizedName.includes(" khac");
};

const isOtherSelection = (food: FoodFromApi | null) => Boolean(food && isOtherFood(food));

const AddFoodToFridgeScreen: React.FC<AddFoodToFridgeScreenProps> = ({ onCancel, onAdded }) => {
  const [mode, setMode] = useState<AddFoodMode>("SHOPPING_PLAN");
  const [allFoods, setAllFoods] = useState<FoodFromApi[]>([]);
  const [foodSuggestions, setFoodSuggestions] = useState<FoodFromApi[]>([]);
  const [isSearchingFoods, setIsSearchingFoods] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualForm, setManualForm] = useState<ManualFormState>({
    foodName: "",
    selectedFood: null,
    customName: "",
    quantity: "",
    storageLocation: "COOL",
    specificLocation: "",
    addedDate: getTodayInputValue(),
    expiryDate: "",
    note: "",
  });
  const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>(() => {
    return shoppingCategories.reduce<Record<string, ItemStatus>>((acc, category) => {
      category.items.forEach((item) => {
        acc[item.id] = item.selectedByDefault ? "selected" : "skipped";
      });
      return acc;
    }, {});
  });

  const selectedCount = Object.values(itemStatuses).filter((status) => status === "selected").length;
  const skippedCount = Object.values(itemStatuses).filter((status) => status === "skipped").length;
  const selectedManualFood = manualForm.selectedFood;
  const hasTypedFoodName = manualForm.foodName.trim().length > 0;
  const showOtherFoodChoices = hasTypedFoodName && !isSearchingFoods && foodSuggestions.length === 0;
  const shouldShowCustomName = isOtherSelection(selectedManualFood);

  const otherFoodsByCategory = useMemo(() => {
    const grouped = new Map<string, FoodFromApi[]>();

    allFoods.filter(isOtherFood).forEach((food) => {
      const categoryName = food.categoryName || "Danh mục khác";
      grouped.set(categoryName, [...(grouped.get(categoryName) || []), food]);
    });

    return Array.from(grouped.entries());
  }, [allFoods]);

  useEffect(() => {
    const loadFoods = async () => {
      try {
        const response = await api.get<FoodFromApi[]>("/api/foods");
        setAllFoods(response.data);
      } catch {
        setAllFoods([]);
      }
    };

    loadFoods();
  }, []);

  useEffect(() => {
    const keyword = manualForm.foodName.trim();

    if (!keyword) {
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
        setFoodSuggestions(response.data.filter((food) => !isOtherFood(food)));
      } catch {
        setFoodSuggestions([]);
      } finally {
        setIsSearchingFoods(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [manualForm.foodName]);

  const setItemStatus = (itemId: string, status: ItemStatus) => {
    setItemStatuses((current) => ({ ...current, [itemId]: status }));
  };

  const updateManualForm = (nextValues: Partial<ManualFormState>) => {
    setManualForm((current) => ({ ...current, ...nextValues }));
    setManualError("");
  };

  const handleFoodNameChange = (value: string) => {
    updateManualForm({
      foodName: value,
      selectedFood: null,
      customName: "",
    });
  };

  const handleSelectFood = (food: FoodFromApi) => {
    updateManualForm({
      foodName: food.name,
      selectedFood: food,
      customName: isOtherFood(food) ? manualForm.foodName.trim() : "",
    });
    setFoodSuggestions([]);
  };

  const validateManualForm = () => {
    if (!selectedManualFood) {
      return "Vui lòng chọn thực phẩm từ danh sách gợi ý.";
    }

    if (shouldShowCustomName && !manualForm.customName.trim()) {
      return "Vui lòng nhập tên thực phẩm cụ thể.";
    }

    const quantity = Number(manualForm.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return "Số lượng phải lớn hơn 0.";
    }

    if (!manualForm.storageLocation) {
      return "Vui lòng chọn vị trí chính.";
    }

    if (!manualForm.expiryDate) {
      return "Vui lòng chọn hạn sử dụng.";
    }

    return "";
  };

  const handleSubmitManual = async () => {
    const validationError = validateManualForm();

    if (validationError) {
      setManualError(validationError);
      return;
    }

    if (!selectedManualFood) return;

    setIsSubmittingManual(true);
    setManualError("");

    try {
      await api.post("/api/fridge-items", {
        foodId: selectedManualFood.id,
        customName: shouldShowCustomName ? manualForm.customName.trim() : null,
        quantity: Number(manualForm.quantity),
        storageLocation: manualForm.storageLocation,
        specificLocation: manualForm.specificLocation || null,
        addedDate: manualForm.addedDate || null,
        expiryDate: manualForm.expiryDate,
        note: manualForm.note.trim() || null,
      });

      onAdded?.();
      onCancel();
    } catch {
      setManualError("Không thêm được thực phẩm vào tủ lạnh. Vui lòng thử lại.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="add-fridge-screen">
      <header className="add-fridge-header">
        <button className="add-fridge-back" type="button" onClick={onCancel} aria-label="Quay lại tủ lạnh">
          <span />
        </button>
        <div>
          <h1>Thêm thực phẩm vào tủ lạnh</h1>
          <p>Xác nhận thực phẩm đã mua hoặc thêm thực phẩm thủ công vào tủ lạnh</p>
        </div>
      </header>

      <div className="add-fridge-tabs" role="tablist" aria-label="Cách thêm thực phẩm">
        <button
          className={mode === "SHOPPING_PLAN" ? "active" : ""}
          type="button"
          onClick={() => setMode("SHOPPING_PLAN")}
        >
          Từ kế hoạch đi chợ
        </button>
        <button className={mode === "MANUAL" ? "active" : ""} type="button" onClick={() => setMode("MANUAL")}>
          Thêm thủ công
        </button>
      </div>

      {mode === "SHOPPING_PLAN" ? (
        <div className="add-fridge-plan-layout">
          <section className="purchased-food-card">
            <h2>Danh sách thực phẩm đã mua</h2>
            <p>Chọn thực phẩm cần đưa vào tủ và bổ sung thông tin lưu trữ.</p>

            <div className="shopping-category-list">
              {shoppingCategories.map((category) => (
                <section className="shopping-category" key={category.id}>
                  <div className="shopping-category-header">
                    <div className="shopping-category-icon" style={{ backgroundColor: category.color }}>
                      {category.icon}
                    </div>
                    <div>
                      <h3>{category.name}</h3>
                      <p>{category.items.length} mục</p>
                    </div>
                  </div>

                  <div className="shopping-item-list">
                    {category.items.map((item) => {
                      const status = itemStatuses[item.id];
                      return (
                        <article className={`shopping-item ${status === "selected" ? "selected" : ""}`} key={item.id}>
                          <div className="shopping-item-main">
                            <button
                              className={`shopping-check ${status === "selected" ? "selected" : ""}`}
                              type="button"
                              onClick={() => setItemStatus(item.id, status === "selected" ? "skipped" : "selected")}
                              aria-label={status === "selected" ? "Bỏ chọn thực phẩm" : "Chọn thực phẩm"}
                            >
                              {status === "selected" && <span />}
                            </button>

                            <div className="shopping-item-info">
                              <div className="shopping-item-topline">
                                <h4>{item.name}</h4>
                                <div className="shopping-item-actions">
                                  <button
                                    className={status === "selected" ? "active" : ""}
                                    type="button"
                                    onClick={() => setItemStatus(item.id, "selected")}
                                  >
                                    Đã mua
                                  </button>
                                  <button
                                    className={status === "skipped" ? "active skip" : ""}
                                    type="button"
                                    onClick={() => setItemStatus(item.id, "skipped")}
                                  >
                                    Bỏ qua
                                  </button>
                                </div>
                              </div>
                              <p>
                                Đã mua: {item.quantity} {item.unit}
                              </p>
                            </div>
                          </div>

                          {item.expanded && status === "selected" && (
                            <div className="shopping-item-fields">
                              <Field label="SL nhập" value={String(item.quantity)} readOnly />
                              <Field label="Đơn vị" as="select" options={unitOptions} value={item.unit} disabled />
                              <Field label="Hạn sử dụng" type="date" />
                              <Field label="Danh mục" as="select" options={[category.name]} value={category.name} disabled />
                              <Field
                                label="Vị trí chính"
                                as="select"
                                options={storageLocationOptions}
                                value="COOL"
                              />
                              <Field
                                label="Vị trí cụ thể"
                                as="select"
                                options={specificLocationOptions}
                                value="MIDDLE_SHELF"
                              />
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <aside className="add-fridge-summary">
            <h2>Tóm tắt nhập tủ</h2>

            <div className="add-fridge-summary-stats">
              <SummaryBox label="Đã chọn" value={selectedCount} variant="selected" />
              <SummaryBox label="Cần bổ sung HSD" value={0} variant="warning" />
              <SummaryBox label="Bỏ qua" value={skippedCount} variant="muted" />
            </div>

            <div className="add-fridge-note">
              <h3>Lưu ý</h3>
              <ul>
                <li>Chỉ thực phẩm đã chọn mới được thêm vào tủ.</li>
                <li>Cần bổ sung hạn sử dụng và vị trí lưu trữ.</li>
                <li>Có thể bỏ qua thực phẩm đã dùng ngay.</li>
              </ul>
            </div>

            <div className="add-fridge-summary-actions">
              <button type="button" onClick={onCancel}>
                Hủy
              </button>
              <button type="button">Xác nhận thêm vào tủ</button>
            </div>
          </aside>
        </div>
      ) : (
        <section className="manual-add-card">
          <h2>Thêm thực phẩm thủ công</h2>
          <p>Nhập thông tin thực phẩm cần lưu trữ trong tủ lạnh.</p>

          <div className="manual-form">
            <label className="add-fridge-field wide manual-food-search">
              <span>
                Tên thực phẩm <strong>*</strong>
              </span>
              <input
                type="text"
                value={manualForm.foodName}
                onChange={(event) => handleFoodNameChange(event.target.value)}
                placeholder="Nhập tên thực phẩm"
                autoComplete="off"
              />

              {hasTypedFoodName && !selectedManualFood && (
                <div className="manual-food-suggestions">
                  {isSearchingFoods && <p className="manual-suggestion-state">Đang tìm thực phẩm...</p>}

                  {!isSearchingFoods &&
                    foodSuggestions.map((food) => (
                      <button type="button" key={food.id} onClick={() => handleSelectFood(food)}>
                        <strong>{food.name}</strong>
                        <span>
                          {food.categoryName || "Chưa có danh mục"}
                          {food.unit ? ` · ${food.unit}` : ""}
                        </span>
                      </button>
                    ))}

                  {showOtherFoodChoices && (
                    <div className="manual-other-foods">
                      <p>Không có thực phẩm khớp. Chọn nhóm thực phẩm phù hợp:</p>
                      {otherFoodsByCategory.map(([categoryName, foods]) => (
                        <div className="manual-other-category" key={categoryName}>
                          <span>{categoryName}</span>
                          <div>
                            {foods.map((food) => (
                              <button type="button" key={food.id} onClick={() => handleSelectFood(food)}>
                                {food.name}
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
                value={manualForm.customName}
                onChange={(value) => updateManualForm({ customName: value })}
                placeholder="Nhập tên thực phẩm cụ thể"
                wide
              />
            )}

            <Field label="Danh mục" required value={selectedManualFood?.categoryName || ""} placeholder="Chọn thực phẩm trước" disabled />
            <Field
              label="Số lượng"
              required
              value={manualForm.quantity}
              onChange={(value) => updateManualForm({ quantity: value })}
              placeholder="Nhập số lượng"
              type="number"
            />
            <Field label="Đơn vị" required value={selectedManualFood?.unit || ""} placeholder="Chọn thực phẩm trước" disabled />
            <Field
              label="Ngày nhập"
              type="date"
              value={manualForm.addedDate}
              onChange={(value) => updateManualForm({ addedDate: value })}
            />
            <Field
              label="Hạn sử dụng"
              required
              type="date"
              value={manualForm.expiryDate}
              onChange={(value) => updateManualForm({ expiryDate: value })}
            />
            <Field
              label="Vị trí chính"
              required
              as="select"
              options={storageLocationOptions}
              value={manualForm.storageLocation}
              onChange={(value) => updateManualForm({ storageLocation: value as StorageLocation })}
            />
            <Field
              label="Vị trí cụ thể"
              as="select"
              options={specificLocationOptions}
              value={manualForm.specificLocation}
              onChange={(value) => updateManualForm({ specificLocation: value })}
              placeholder="Chọn vị trí cụ thể"
            />
            <Field
              label="Ghi chú"
              value={manualForm.note}
              onChange={(value) => updateManualForm({ note: value })}
              placeholder="Nhập ghi chú nếu có"
              wide
              multiline
            />
          </div>

          {manualError && <div className="manual-form-error">{manualError}</div>}

          <div className="manual-form-actions">
            <button type="button" onClick={onCancel} disabled={isSubmittingManual}>
              Hủy
            </button>
            <button type="button" onClick={handleSubmitManual} disabled={isSubmittingManual}>
              {isSubmittingManual ? "Đang thêm..." : "Thêm vào tủ"}
            </button>
          </div>
        </section>
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
  readOnly?: boolean;
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
  readOnly,
  onChange,
}) => {
  return (
    <label className={`add-fridge-field ${wide ? "wide" : ""} ${multiline ? "multiline" : ""}`}>
      <span>
        {label} {required && <strong>*</strong>}
      </span>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
        />
      ) : as === "select" ? (
        <select value={value || ""} onChange={(event) => onChange?.(event.target.value)} disabled={disabled}>
          {!value && <option value="">{placeholder || `Chọn ${label.toLowerCase()}`}</option>}
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
          readOnly={readOnly}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "0.01" : undefined}
        />
      )}
    </label>
  );
};

type SummaryBoxProps = {
  label: string;
  value: number;
  variant: "selected" | "warning" | "muted";
};

const SummaryBox: React.FC<SummaryBoxProps> = ({ label, value, variant }) => {
  return (
    <div className={`summary-box ${variant}`}>
      <span>{label}</span>
      <strong>{String(value).padStart(2, "0")}</strong>
    </div>
  );
};

export default AddFoodToFridgeScreen;
