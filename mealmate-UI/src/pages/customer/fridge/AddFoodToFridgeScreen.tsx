import React, { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import "./AddFoodToFridgeScreen.css";

type AddFoodMode = "SHOPPING_PLAN" | "MANUAL";
type ItemStatus = "idle" | "selected";
type StorageLocation = "COOL" | "FREEZER" | "DRY";

type FoodFromApi = {
  id: number;
  categoryId?: number;
  categoryName?: string;
  name: string;
  unit?: string;
  synonyms?: string;
};

type ShoppingImportCandidateFromApi = {
  shoppingListItemId: number;
  shoppingListId: number;
  plannedDate?: string;
  foodId: number;
  foodName: string;
  customName?: string;
  categoryId?: number;
  categoryName?: string;
  categoryIconKey?: string;
  categoryColorCode?: string;
  quantity: number;
  unit?: string;
  note?: string;
  importedToFridgeAt?: string;
};

type ShoppingDraft = {
  status: ItemStatus;
  quantity: string;
  storageLocation: StorageLocation | "";
  specificLocation: string;
  expiryDate: string;
  note: string;
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

const categoryIconMap: Record<string, string> = {
  vegetable: "🥬",
  fruit: "🍎",
  meat: "🥩",
  seafood: "🐟",
  dairy: "🥛",
  "dry-food": "🌾",
  dry_food: "🌾",
  spice: "🧂",
  default_food: "🍽️",
};

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

const getCandidateDisplayName = (candidate: ShoppingImportCandidateFromApi) =>
  candidate.customName || candidate.foodName || "Thực phẩm";

const getCandidateIcon = (candidate: ShoppingImportCandidateFromApi) =>
  categoryIconMap[candidate.categoryIconKey || "default_food"] || categoryIconMap.default_food;

const createDraft = (candidate: ShoppingImportCandidateFromApi): ShoppingDraft => ({
  status: "idle",
  quantity: String(candidate.quantity ?? ""),
  storageLocation: "COOL",
  specificLocation: "",
  expiryDate: "",
  note: candidate.note || "",
});

const AddFoodToFridgeScreen: React.FC<AddFoodToFridgeScreenProps> = ({ onCancel, onAdded }) => {
  const [mode, setMode] = useState<AddFoodMode>("SHOPPING_PLAN");
  const [allFoods, setAllFoods] = useState<FoodFromApi[]>([]);
  const [foodSuggestions, setFoodSuggestions] = useState<FoodFromApi[]>([]);
  const [isSearchingFoods, setIsSearchingFoods] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState("");
  const [shoppingCandidates, setShoppingCandidates] = useState<ShoppingImportCandidateFromApi[]>([]);
  const [shoppingDrafts, setShoppingDrafts] = useState<Record<number, ShoppingDraft>>({});
  const [isLoadingShopping, setIsLoadingShopping] = useState(false);
  const [isSubmittingShopping, setIsSubmittingShopping] = useState(false);
  const [skippingItemIds, setSkippingItemIds] = useState<Set<number>>(new Set());
  const [shoppingError, setShoppingError] = useState("");
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

  const selectedManualFood = manualForm.selectedFood;
  const hasTypedFoodName = manualForm.foodName.trim().length > 0;
  const showOtherFoodChoices = hasTypedFoodName && !isSearchingFoods && foodSuggestions.length === 0;
  const shouldShowCustomName = isOtherSelection(selectedManualFood);

  const selectedShoppingDrafts = Object.values(shoppingDrafts).filter((draft) => draft.status === "selected");
  const selectedCount = selectedShoppingDrafts.length;
  const missingExpiryCount = selectedShoppingDrafts.filter((draft) => !draft.expiryDate).length;
  const selectedItemsMissingRequiredInfo = selectedShoppingDrafts.some((draft) => {
    const quantity = Number(draft.quantity);
    return !Number.isFinite(quantity) || quantity <= 0 || !draft.storageLocation || !draft.expiryDate;
  });

  const shoppingCandidatesByCategory = useMemo(() => {
    const grouped = new Map<string, ShoppingImportCandidateFromApi[]>();

    shoppingCandidates.forEach((candidate) => {
      const categoryName = candidate.categoryName || "Danh mục khác";
      grouped.set(categoryName, [...(grouped.get(categoryName) || []), candidate]);
    });

    return Array.from(grouped.entries());
  }, [shoppingCandidates]);

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
    const loadShoppingCandidates = async () => {
      setIsLoadingShopping(true);
      setShoppingError("");

      try {
        const response = await api.get<ShoppingImportCandidateFromApi[]>("/api/fridge-items/import-candidates");
        const filtered = response.data.filter(candidate => !candidate.importedToFridgeAt);
        setShoppingCandidates(filtered);
        setShoppingDrafts(
          filtered.reduce<Record<number, ShoppingDraft>>((acc, candidate) => {
            acc[candidate.shoppingListItemId] = createDraft(candidate);
            return acc;
          }, {})
        );
      } catch {
        setShoppingCandidates([]);
        setShoppingDrafts({});
        setShoppingError("Không tải được danh sách thực phẩm đã mua.");
      } finally {
        setIsLoadingShopping(false);
      }
    };

    if (mode === "SHOPPING_PLAN") {
      loadShoppingCandidates();
    }
  }, [mode]);

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

  const updateShoppingDraft = (shoppingListItemId: number, nextValues: Partial<ShoppingDraft>) => {
    setShoppingDrafts((current) => ({
      ...current,
      [shoppingListItemId]: {
        ...current[shoppingListItemId],
        ...nextValues,
      },
    }));
    setShoppingError("");
  };

  const handleSkipShoppingCandidate = async (shoppingListItemId: number) => {
    setSkippingItemIds((current) => new Set(current).add(shoppingListItemId));
    setShoppingError("");

    try {
      await api.patch(`/api/fridge-items/import-candidates/${shoppingListItemId}/skip`);
      setShoppingCandidates((current) =>
        current.filter((candidate) => candidate.shoppingListItemId !== shoppingListItemId)
      );
      setShoppingDrafts((current) => {
        const next = { ...current };
        delete next[shoppingListItemId];
        return next;
      });
    } catch {
      setShoppingError("Không bỏ qua được thực phẩm này. Vui lòng thử lại.");
    } finally {
      setSkippingItemIds((current) => {
        const next = new Set(current);
        next.delete(shoppingListItemId);
        return next;
      });
    }
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

  const validateShoppingImport = () => {
    if (selectedCount === 0) {
      return "Vui lòng chọn ít nhất một thực phẩm để thêm vào tủ.";
    }

    if (missingExpiryCount > 0) {
      return "Vui lòng bổ sung hạn sử dụng cho các thực phẩm đã chọn.";
    }

    const invalidDraft = shoppingCandidates.find((candidate) => {
      const draft = shoppingDrafts[candidate.shoppingListItemId];
      const quantity = Number(draft?.quantity);

      return (
        draft?.status === "selected" &&
        (!Number.isFinite(quantity) || quantity <= 0 || !draft.storageLocation)
      );
    });

    if (invalidDraft) {
      return "Vui lòng kiểm tra số lượng và vị trí chính của thực phẩm đã chọn.";
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
        unit: selectedManualFood.unit || null,
      });

      onAdded?.();
      onCancel();
    } catch {
      setManualError("Không thêm được thực phẩm vào tủ lạnh. Vui lòng thử lại.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleSubmitShoppingImport = async () => {
    const validationError = validateShoppingImport();

    if (validationError) {
      setShoppingError(validationError);
      return;
    }

    const items = shoppingCandidates
      .filter((candidate) => shoppingDrafts[candidate.shoppingListItemId]?.status === "selected")
      .map((candidate) => {
        const draft = shoppingDrafts[candidate.shoppingListItemId];

        return {
          shoppingListItemId: candidate.shoppingListItemId,
          foodId: candidate.foodId,
          customName: candidate.customName || null,
          quantity: Number(draft.quantity),
          storageLocation: draft.storageLocation,
          specificLocation: draft.specificLocation || null,
          addedDate: getTodayInputValue(),
          expiryDate: draft.expiryDate,
          note: draft.note.trim() || null,
          unit: candidate.unit || null,
        };
      });

    setIsSubmittingShopping(true);
    setShoppingError("");

    try {
      await api.post("/api/fridge-items/import-from-shopping", { items });
      onAdded?.();
      onCancel();
    } catch {
      setShoppingError("Không thêm được thực phẩm đã mua vào tủ lạnh. Vui lòng thử lại.");
    } finally {
      setIsSubmittingShopping(false);
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

      <div className="add-fridge-tabs-bar">
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
      </div>

      {mode === "SHOPPING_PLAN" ? (
        <div className="add-fridge-plan-layout">
          <section className="purchased-food-card">
            <h2>Danh sách thực phẩm đã mua</h2>
            <p>Chọn thực phẩm cần đưa vào tủ và bổ sung thông tin lưu trữ.</p>

            {isLoadingShopping && <div className="add-fridge-state">Đang tải danh sách thực phẩm đã mua...</div>}

            {!isLoadingShopping && shoppingCandidates.length === 0 && !shoppingError && (
              <div className="add-fridge-state">Chưa có thực phẩm đã mua nào cần nhập vào tủ lạnh.</div>
            )}

            <div className="shopping-category-list">
              {shoppingCandidatesByCategory.map(([categoryName, items]) => {
                const firstItem = items[0];

                return (
                  <section className="shopping-category" key={categoryName}>
                    <div className="shopping-category-header">
                      <div
                        className="shopping-category-icon"
                        style={{ backgroundColor: firstItem.categoryColorCode || "#E5F5FF" }}
                      >
                        {getCandidateIcon(firstItem)}
                      </div>
                      <div>
                        <h3>{categoryName}</h3>
                        <p>{items.length} mục</p>
                      </div>
                    </div>

                    <div className="shopping-item-list">
                      {items.map((item) => {
                        const draft = shoppingDrafts[item.shoppingListItemId] || createDraft(item);
                        const status = draft.status;
                        const isSkipping = skippingItemIds.has(item.shoppingListItemId);

                        return (
                          <article className={`shopping-item ${status === "selected" ? "selected" : ""}`} key={item.shoppingListItemId}>
                            <div className="shopping-item-main">
                              <button
                                className={`shopping-check ${status === "selected" ? "selected" : ""}`}
                                type="button"
                                onClick={() =>
                                  updateShoppingDraft(item.shoppingListItemId, {
                                    status: status === "selected" ? "idle" : "selected",
                                  })
                                }
                                disabled={isSkipping}
                                aria-label={status === "selected" ? "Bỏ chọn thực phẩm" : "Chọn thực phẩm"}
                              >
                                {status === "selected" && <span />}
                              </button>

                              <div className="shopping-item-info">
                                <div className="shopping-item-topline">
                                  <h4>{getCandidateDisplayName(item)}</h4>
                                  <div className="shopping-item-actions">
                                    <button
                                      type="button"
                                      className="shopping-skip-button"
                                      onClick={() => handleSkipShoppingCandidate(item.shoppingListItemId)}
                                      disabled={isSkipping}
                                    >
                                      {isSkipping ? "Đang bỏ qua..." : "Bỏ qua"}
                                    </button>
                                  </div>
                                </div>
                                <p>
                                  Đã mua: {item.quantity} {item.unit || ""}
                                </p>
                              </div>
                            </div>

                            {status === "selected" && (
                              <div className="shopping-item-fields">
                                <Field
                                  label="SL nhập"
                                  value={draft.quantity}
                                  type="number"
                                  onChange={(value) => updateShoppingDraft(item.shoppingListItemId, { quantity: value })}
                                />
                                <Field label="Đơn vị" value={item.unit || ""} disabled />
                                <Field
                                  label="Hạn sử dụng"
                                  required
                                  type="date"
                                  value={draft.expiryDate}
                                  onChange={(value) => updateShoppingDraft(item.shoppingListItemId, { expiryDate: value })}
                                />
                                <Field label="Danh mục" value={categoryName} disabled />
                                <Field
                                  label="Vị trí chính"
                                  required
                                  as="select"
                                  options={storageLocationOptions}
                                  value={draft.storageLocation}
                                  onChange={(value) =>
                                    updateShoppingDraft(item.shoppingListItemId, { storageLocation: value as StorageLocation })
                                  }
                                />
                                <Field
                                  label="Vị trí cụ thể"
                                  as="select"
                                  options={specificLocationOptions}
                                  value={draft.specificLocation}
                                  onChange={(value) => updateShoppingDraft(item.shoppingListItemId, { specificLocation: value })}
                                  placeholder="Chọn vị trí cụ thể"
                                />
                                <Field
                                  label="Ghi chú"
                                  value={draft.note}
                                  onChange={(value) => updateShoppingDraft(item.shoppingListItemId, { note: value })}
                                  placeholder="Nhập ghi chú nếu có"
                                  wide
                                />
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          <aside className="add-fridge-summary">
            <h2>Tóm tắt nhập tủ</h2>

            <div className="add-fridge-summary-stats">
              <SummaryBox label="Đã chọn" value={selectedCount} variant="selected" />
              <SummaryBox label="Cần bổ sung HSD" value={missingExpiryCount} variant="warning" />
              <SummaryBox label="Chờ nhập" value={shoppingCandidates.length} variant="muted" />
            </div>

            <div className="add-fridge-note">
              <h3>Lưu ý</h3>
              <ul>
                <li>Chỉ thực phẩm đã chọn mới được thêm vào tủ.</li>
                <li>Cần bổ sung hạn sử dụng và vị trí lưu trữ.</li>
                <li>Có thể bỏ qua thực phẩm đã dùng ngay.</li>
              </ul>
            </div>

            {shoppingError && <div className="manual-form-error">{shoppingError}</div>}

            <div className="add-fridge-summary-actions">
              <button
                type="button"
                onClick={handleSubmitShoppingImport}
                disabled={isSubmittingShopping || selectedCount === 0 || selectedItemsMissingRequiredInfo}
              >
                {isSubmittingShopping ? "Đang thêm..." : "Xác nhận thêm vào tủ"}
              </button>
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
