import React, { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import "./AddFoodToFridgeScreen.css";
import UnitDropdown from "./UnitDropdown";

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
  unit: string;
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

const highlightMatch = (text: string, keyword: string): React.ReactNode => {
  if (!keyword.trim()) return text;
  const normalizedKeyword = normalizeSearchText(keyword);
  const normalizedText = normalizeSearchText(text);
  const idx = normalizedText.indexOf(normalizedKeyword);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + normalizedKeyword.length)}</mark>
      {text.slice(idx + normalizedKeyword.length)}
    </>
  );
};

const getFoodUnitOptions = (food: FoodFromApi | null) =>
  Array.from(
    new Set(
      (food?.unit || "")
        .split(",")
        .map((unit) => unit.trim())
        .filter(Boolean)
    )
  );

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
  const [isLoadingFoods, setIsLoadingFoods] = useState(false);
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
    unit: "",
    storageLocation: "COOL",
    specificLocation: "",
    addedDate: getTodayInputValue(),
    expiryDate: "",
    note: "",
  });

  const selectedManualFood = manualForm.selectedFood;
  const hasTypedFoodName = manualForm.foodName.trim().length > 0;

  const foodSuggestions = useMemo(() => {
    const keyword = manualForm.foodName.trim();
    if (!keyword || isLoadingFoods) return [];
    const normalizedKeyword = normalizeSearchText(keyword);

    return allFoods
      .filter((food) => {
        const nameMatch = normalizeSearchText(food.name).includes(normalizedKeyword);
        const synonymMatch = food.synonyms
          ? normalizeSearchText(food.synonyms).includes(normalizedKeyword)
          : false;
        return nameMatch || synonymMatch;
      })
      .map((food) => {
        const normalizedName = normalizeSearchText(food.name);
        const nameIdx = normalizedName.indexOf(normalizedKeyword);
        const nameMatch = nameIdx !== -1;
        const synonymMatch = food.synonyms
          ? normalizeSearchText(food.synonyms).includes(normalizedKeyword)
          : false;
        const isOther = isOtherFood(food);
        // Tier thấp hơn = xếp trên đầu
        // 0: tên bắt đầu bằng keyword  (không phải Khác)
        // 1: tên chứa keyword          (không phải Khác)
        // 2: chỉ synonym khớp          (không phải Khác)
        // 3: tên chứa keyword          (Khác)
        // 4: chỉ synonym khớp          (Khác)
        let tier: number;
        if (!isOther && nameMatch && nameIdx === 0) tier = 0;
        else if (!isOther && nameMatch) tier = 1;
        else if (!isOther && synonymMatch) tier = 2;
        else if (isOther && nameMatch) tier = 3;
        else tier = 4;
        return { food, tier, nameIdx };
      })
      .sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        // Cùng tier: vị trí khớp sớm hơn xếp trên
        if (a.nameIdx !== -1 && b.nameIdx !== -1) return a.nameIdx - b.nameIdx;
        return 0;
      })
      .map(({ food }) => food);
  }, [allFoods, manualForm.foodName, isLoadingFoods]);

  const showOtherFoodChoices = hasTypedFoodName && !isLoadingFoods && foodSuggestions.length === 0;
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

  const unitOptions = useMemo(() => getFoodUnitOptions(selectedManualFood), [selectedManualFood]);

  useEffect(() => {
    const loadFoods = async () => {
      setIsLoadingFoods(true);
      try {
        const response = await api.get<FoodFromApi[]>("/api/foods");
        setAllFoods(response.data);
      } catch {
        setAllFoods([]);
      } finally {
        setIsLoadingFoods(false);
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
      unit: "",
    });
  };

  const handleSelectFood = (food: FoodFromApi) => {
    const foodUnitOptions = getFoodUnitOptions(food);

    updateManualForm({
      foodName: food.name,
      selectedFood: food,
      customName: isOtherFood(food) ? manualForm.foodName.trim() : "",
      unit: foodUnitOptions[0] || "",
    });
  };

  const validateManualForm = () => {
    if (!selectedManualFood) {
      return "Vui lòng chọn thực phẩm từ danh sách gợi ý.";
    }

    if (shouldShowCustomName && !manualForm.customName.trim()) {
      return "Vui lòng nhập tên thực phẩm cụ thể.";
    }

    if (!manualForm.unit.trim()) {
      return "Vui lòng chọn đơn vị.";
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
        unit: manualForm.unit || null,
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
                  {isLoadingFoods && <p className="manual-suggestion-state">Đang tải dữ liệu thực phẩm...</p>}

                  {!isLoadingFoods &&
                    foodSuggestions.map((food) => {
                      const keyword = manualForm.foodName.trim();
                      const normalizedKeyword = normalizeSearchText(keyword);
                      const synonymParts =
                        food.synonyms
                          ?.split(",")
                          .map((s) => s.trim())
                          .filter(Boolean) || [];
                      // Synonyms khớp lên đầu để luôn hiển thị và được highlight;
                      // CSS ellipsis xử lý nếu tổng quá dài.
                      const displaySynonyms = [
                        ...synonymParts.filter((s) => normalizeSearchText(s).includes(normalizedKeyword)),
                        ...synonymParts.filter((s) => !normalizeSearchText(s).includes(normalizedKeyword)),
                      ];
                      return (
                        <button type="button" key={food.id} onClick={() => handleSelectFood(food)}>
                          <strong>{highlightMatch(food.name, keyword)}</strong>
                          <span>
                            {food.categoryName || "Chưa có danh mục"}
                            {food.unit ? ` · ${food.unit}` : ""}
                            {displaySynonyms.length > 0 && (
                              <em className="suggestion-synonyms">
                                {" · "}
                                {displaySynonyms.map((s, i) => (
                                  <React.Fragment key={i}>
                                    {i > 0 && ", "}
                                    {highlightMatch(s, keyword)}
                                  </React.Fragment>
                                ))}
                              </em>
                            )}
                          </span>
                        </button>
                      );
                    })}

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
            {unitOptions.length > 1 ? (
              <label className="add-fridge-field">
                <span>
                  Đơn vị <strong>*</strong>
                </span>
                <UnitDropdown
                  options={unitOptions}
                  value={manualForm.unit}
                  onChange={(value) => updateManualForm({ unit: value })}
                />
              </label>
            ) : (
              <Field
                label="Đơn vị"
                required
                value={manualForm.unit}
                placeholder={selectedManualFood ? "Chưa cấu hình đơn vị" : "Chọn thực phẩm trước"}
                disabled
              />
            )}
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
