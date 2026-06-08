import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./RecipeBrowser.css";

import RecipeCard from "./RecipeCard";
import RecipeDetailPopup from "./RecipeDetailPopup";
import {
  addFavoriteRecipe,
  fetchFavoriteRecipeIds,
  fetchRecipeLibrary,
  fetchRecipeSuggestions,
  removeFavoriteRecipe,
} from "./recipeApi";
import type { RecipeFromApi, RecipeIngredientFromApi } from "./recipeTypes";
import { addPendingShoppingItems } from "@/features/shopping-plan/shoppingSuggestions";

type RecipeBrowserVariant = "suggestion" | "library";

type RecipeBrowserProps = {
  variant: RecipeBrowserVariant;
  onBack?: () => void;
  searchValue?: string;
};

type StatusFilter = "all" | "canCook" | "expiring";
type MealFilter = "all" | "BREAKFAST" | "LUNCH" | "DINNER";
type DifficultyFilter = "all" | "EASY" | "MEDIUM" | "HARD";
type FilterDropdown = "meal" | "difficulty" | null;

type ToastState = { message: string; variant: "success" | "info" };

const difficultyRank = (difficulty?: string) => {
  if (difficulty === "EASY") return 0;
  if (difficulty === "MEDIUM") return 1;
  if (difficulty === "HARD") return 2;
  return 3;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .trim();

// Chips cho suggestion: Tất cả + Nấu được ngay + Sắp hết hạn
const suggestionStatusChips: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "canCook", label: "Nấu được ngay" },
  { value: "expiring", label: "Sắp hết hạn" },
];

// Chips cho library: Tất cả + Nấu được ngay (bỏ Sắp hết hạn)
const libraryStatusChips: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "canCook", label: "Nấu được ngay" },
];

const mealChips: Array<{ value: MealFilter; label: string }> = [
  { value: "all", label: "Mọi bữa" },
  { value: "BREAKFAST", label: "Sáng" },
  { value: "LUNCH", label: "Trưa" },
  { value: "DINNER", label: "Tối" },
];

const difficultyChips: Array<{ value: DifficultyFilter; label: string }> = [
  { value: "all", label: "Mọi độ khó" },
  { value: "EASY", label: "Dễ" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HARD", label: "Khó" },
];

const RecipeBrowser: React.FC<RecipeBrowserProps> = ({ variant, onBack, searchValue }) => {
  const [recipes, setRecipes] = useState<RecipeFromApi[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeFromApi | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [internalKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [mealFilter, setMealFilter] = useState<MealFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [openFilterDropdown, setOpenFilterDropdown] = useState<FilterDropdown>(null);
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  const statusChips = variant === "suggestion" ? suggestionStatusChips : libraryStatusChips;
  const keyword = searchValue ?? internalKeyword;

  const loadRecipes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [data, favorites] = await Promise.all([
        variant === "suggestion" ? fetchRecipeSuggestions(40) : fetchRecipeLibrary(120),
        fetchFavoriteRecipeIds().catch(() => [] as number[]),
      ]);

      setRecipes(data);
      const ids = new Set<number>(favorites);
      data.forEach((recipe) => {
        if (recipe.favorite) ids.add(recipe.recipeId);
      });
      setFavoriteIds(ids);
    } catch {
      setRecipes([]);
      setErrorMessage(
        variant === "suggestion"
          ? "Không tải được danh sách món ăn gợi ý."
          : "Không tải được thư viện công thức."
      );
    } finally {
      setIsLoading(false);
    }
  }, [variant]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const handleToggleFavorite = useCallback(
    async (recipe: RecipeFromApi) => {
      const id = recipe.recipeId;
      if (pendingFavoriteIds.has(id)) return;

      const wasFavorite = favoriteIds.has(id);

      setPendingFavoriteIds((current) => new Set(current).add(id));
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (wasFavorite) next.delete(id);
        else next.add(id);
        return next;
      });

      try {
        if (wasFavorite) {
          await removeFavoriteRecipe(id);
        } else {
          await addFavoriteRecipe(id);
          setToast({ message: `Đã thêm "${recipe.name}" vào món yêu thích.`, variant: "success" });
        }
      } catch {
        setFavoriteIds((current) => {
          const next = new Set(current);
          if (wasFavorite) next.add(id);
          else next.delete(id);
          return next;
        });
        setToast({ message: "Không cập nhật được món yêu thích.", variant: "info" });
      } finally {
        setPendingFavoriteIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    },
    [favoriteIds, pendingFavoriteIds]
  );

  const handleAddMissingToShopping = useCallback(
    (recipe: RecipeFromApi, missing: RecipeIngredientFromApi[]) => {
      if (missing.length === 0) {
        setToast({ message: "Món này đã đủ nguyên liệu, không cần thêm.", variant: "info" });
        return;
      }

      addPendingShoppingItems(
        missing.map((item) => ({
          foodId: item.foodId,
          foodName: item.foodName,
          unit: item.requiredUnit || "kg",
          quantity: item.requiredQuantity ?? 1,
          source: "RECIPE_MISSING" as const,
          note: `Thiếu cho ${recipe.name}`,
        }))
      );

      setToast({
        message: `Đã thêm ${missing.length} nguyên liệu thiếu của "${recipe.name}" vào Kế hoạch đi chợ.`,
        variant: "success",
      });
      // Đóng popup sau khi thêm
      setSelectedRecipe(null);
    },
    []
  );

  const filteredRecipes = useMemo(() => {
    const normalizedKeyword = normalize(keyword);

    const filtered = recipes.filter((recipe) => {
      if (normalizedKeyword && !normalize(recipe.name).includes(normalizedKeyword)) return false;
      if (statusFilter === "canCook" && !recipe.canCook) return false;
      if (statusFilter === "expiring" && recipe.expiringIngredients.length === 0) return false;
      if (favoriteOnly && !favoriteIds.has(recipe.recipeId)) return false;
      if (mealFilter !== "all" && recipe.preferredMealTime !== mealFilter) return false;
      if (difficultyFilter !== "all" && recipe.difficulty !== difficultyFilter) return false;
      return true;
    });

    // Sắp xếp theo % khớp, số badge sắp hết hạn, rồi độ dễ.
    return [...filtered].sort((a, b) => {
      if (b.coveragePercent !== a.coveragePercent) return b.coveragePercent - a.coveragePercent;
      const aExpiring = a.expiringIngredients.length;
      const bExpiring = b.expiringIngredients.length;
      if (bExpiring !== aExpiring) return bExpiring - aExpiring;
      return difficultyRank(a.difficulty) - difficultyRank(b.difficulty);
    });
  }, [recipes, keyword, statusFilter, favoriteOnly, favoriteIds, mealFilter, difficultyFilter]);

  const favoriteCount = favoriteIds.size;
  const selectedMealLabel = mealChips.find((chip) => chip.value === mealFilter)?.label ?? "";
  const selectedDifficultyLabel = difficultyChips.find((chip) => chip.value === difficultyFilter)?.label ?? "";

  return (
    <div className={`recipe-browser ${variant}`}>
      {variant === "suggestion" && (
        <header className="recipe-browser-header">
          {onBack && (
            <button className="recipe-browser-back" type="button" onClick={onBack} aria-label="Quay lại tủ lạnh">
              <span />
            </button>
          )}
          <div className="recipe-browser-title">
            <h1>Gợi ý món ăn</h1>
            <p>Ưu tiên công thức tận dụng thực phẩm đang có và sắp hết hạn trong tủ.</p>
          </div>
        </header>
      )}

      <div className="recipe-browser-toolbar">
        <div className="recipe-browser-filter-groups">
          <div className="recipe-browser-chip-row" role="group" aria-label="Lọc theo trạng thái">
            {statusChips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className={`recipe-browser-chip-${chip.value} ${statusFilter === chip.value ? "active" : ""}`}
                onClick={() => setStatusFilter(chip.value)}
              >
                {chip.label}
              </button>
            ))}
            <button
              type="button"
              className={`recipe-browser-chip-fav ${favoriteOnly ? "active" : ""}`}
              onClick={() => setFavoriteOnly((value) => !value)}
              aria-pressed={favoriteOnly}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill={favoriteOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              Yêu thích{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
            </button>
          </div>

          <div className="recipe-browser-filter-dropdown">
            <button
              type="button"
              className={`recipe-browser-filter-button ${mealFilter !== "all" ? "active" : ""}`}
              onClick={() => setOpenFilterDropdown((current) => (current === "meal" ? null : "meal"))}
              aria-haspopup="menu"
              aria-expanded={openFilterDropdown === "meal"}
            >
              <span>Bữa ăn</span>
              <strong>{selectedMealLabel}</strong>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {openFilterDropdown === "meal" && (
              <div className="recipe-browser-filter-menu" role="menu">
                {mealChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    className={mealFilter === chip.value ? "active" : ""}
                    onClick={() => {
                      setMealFilter(chip.value);
                      setOpenFilterDropdown(null);
                    }}
                    role="menuitemradio"
                    aria-checked={mealFilter === chip.value}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="recipe-browser-filter-dropdown">
            <button
              type="button"
              className={`recipe-browser-filter-button ${difficultyFilter !== "all" ? "active" : ""}`}
              onClick={() => setOpenFilterDropdown((current) => (current === "difficulty" ? null : "difficulty"))}
              aria-haspopup="menu"
              aria-expanded={openFilterDropdown === "difficulty"}
            >
              <span>Độ khó</span>
              <strong>{selectedDifficultyLabel}</strong>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {openFilterDropdown === "difficulty" && (
              <div className="recipe-browser-filter-menu" role="menu">
                {difficultyChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    className={difficultyFilter === chip.value ? "active" : ""}
                    onClick={() => {
                      setDifficultyFilter(chip.value);
                      setOpenFilterDropdown(null);
                    }}
                    role="menuitemradio"
                    aria-checked={difficultyFilter === chip.value}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skeleton loading giống mạng xã hội */}
      {isLoading && (
        <div className="recipe-browser-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="recipe-card-skeleton">
              <div className="recipe-card-skeleton-media" />
              <div className="recipe-card-skeleton-body">
                <div className="recipe-card-skeleton-line long" />
                <div className="recipe-card-skeleton-line short" />
                <div className="recipe-card-skeleton-meta">
                  <div className="recipe-card-skeleton-line half" />
                  <div className="recipe-card-skeleton-line half" />
                  <div className="recipe-card-skeleton-line half" />
                  <div className="recipe-card-skeleton-line half" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="recipe-browser-state error">{errorMessage}</div>
      )}

      {!isLoading && !errorMessage && filteredRecipes.length === 0 && (
        <div className="recipe-browser-state">Không tìm thấy công thức phù hợp.</div>
      )}

      {!isLoading && !errorMessage && filteredRecipes.length > 0 && (
        <div className="recipe-browser-grid">
          {filteredRecipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.recipeId}
              recipe={recipe}
              variant={variant}
              isFavorite={favoriteIds.has(recipe.recipeId)}
              isFavoritePending={pendingFavoriteIds.has(recipe.recipeId)}
              animationDelay={index * 50}
              onOpen={setSelectedRecipe}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailPopup
          recipe={selectedRecipe}
          isFavorite={favoriteIds.has(selectedRecipe.recipeId)}
          isFavoritePending={pendingFavoriteIds.has(selectedRecipe.recipeId)}
          onClose={() => setSelectedRecipe(null)}
          onToggleFavorite={handleToggleFavorite}
          onAddMissingToShopping={handleAddMissingToShopping}
        />
      )}

      {toast && (
        <div className={`recipe-browser-toast ${toast.variant}`} role="status">
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Đóng">×</button>
        </div>
      )}
    </div>
  );
};

export default RecipeBrowser;
