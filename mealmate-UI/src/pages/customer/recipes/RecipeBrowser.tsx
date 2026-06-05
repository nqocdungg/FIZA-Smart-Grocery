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

type RecipeBrowserVariant = "suggestion" | "library";

type RecipeBrowserProps = {
  variant: RecipeBrowserVariant;
  onBack?: () => void;
};

type StatusFilter = "all" | "canCook" | "expiring";
type MealFilter = "all" | "BREAKFAST" | "LUNCH" | "DINNER";
type DifficultyFilter = "all" | "EASY" | "MEDIUM" | "HARD";
type FilterDropdown = "meal" | "difficulty" | null;

type ToastState = { message: string; variant: "success" | "info" };

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const statusChips: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "canCook", label: "Nấu được ngay" },
  { value: "expiring", label: "Sắp hết hạn" },
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

const RecipeBrowser: React.FC<RecipeBrowserProps> = ({ variant, onBack }) => {
  const [recipes, setRecipes] = useState<RecipeFromApi[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeFromApi | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [mealFilter, setMealFilter] = useState<MealFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [openFilterDropdown, setOpenFilterDropdown] = useState<FilterDropdown>(null);
  const [favoriteOnly, setFavoriteOnly] = useState(false);

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
          setToast({ message: `Đã thêm “${recipe.name}” vào món yêu thích.`, variant: "success" });
        }
      } catch {
        // Hoàn tác nếu lỗi
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
      // Danh sách đi chợ sẽ được tích hợp sau — hiện tại hiển thị thông báo demo.
      setToast({
        message: `Đã ghi nhận ${missing.length} nguyên liệu thiếu của “${recipe.name}” để thêm vào danh sách đi chợ.`,
        variant: "success",
      });
    },
    []
  );

  const filteredRecipes = useMemo(() => {
    const normalizedKeyword = normalize(keyword);

    return recipes.filter((recipe) => {
      if (normalizedKeyword && !normalize(recipe.name).includes(normalizedKeyword)) {
        return false;
      }
      if (statusFilter === "canCook" && !recipe.canCook) return false;
      if (statusFilter === "expiring" && recipe.expiringIngredients.length === 0) return false;
      if (favoriteOnly && !favoriteIds.has(recipe.recipeId)) return false;
      if (mealFilter !== "all" && recipe.preferredMealTime !== mealFilter) return false;
      if (difficultyFilter !== "all" && recipe.difficulty !== difficultyFilter) return false;
      return true;
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
        <label className="recipe-browser-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm món ăn..."
          />
        </label>

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

      {isLoading && <div className="recipe-browser-state">Đang tìm món phù hợp...</div>}
      {!isLoading && errorMessage && <div className="recipe-browser-state error">{errorMessage}</div>}
      {!isLoading && !errorMessage && filteredRecipes.length === 0 && (
        <div className="recipe-browser-state">
          {recipes.length === 0
            ? "Chưa có công thức phù hợp với thực phẩm hiện có trong tủ."
            : "Không có món nào khớp với bộ lọc hiện tại."}
        </div>
      )}

      {!isLoading && !errorMessage && filteredRecipes.length > 0 && (
        <section className="recipe-browser-grid">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.recipeId}
              recipe={recipe}
              isFavorite={favoriteIds.has(recipe.recipeId)}
              isFavoritePending={pendingFavoriteIds.has(recipe.recipeId)}
              onOpen={setSelectedRecipe}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </section>
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
          <button type="button" onClick={() => setToast(null)} aria-label="Đóng thông báo">
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeBrowser;
