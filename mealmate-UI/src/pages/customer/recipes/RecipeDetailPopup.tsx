import React, { useMemo, useState } from "react";
import "./RecipeDetailPopup.css";

import {
  difficultyClass,
  difficultyLabel,
  formatQuantity,
  mealTimeLabel,
  recipeEmoji,
  splitInstructions,
  type RecipeFromApi,
  type RecipeIngredientFromApi,
} from "./recipeTypes";

type RecipeDetailPopupProps = {
  recipe: RecipeFromApi;
  isFavorite: boolean;
  isFavoritePending?: boolean;
  onClose: () => void;
  onToggleFavorite: (recipe: RecipeFromApi) => void;
  onAddMissingToShopping: (recipe: RecipeFromApi, missing: RecipeIngredientFromApi[]) => void;
};

const Heart: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="recipe-detail-stat">
    <span className="recipe-detail-stat-icon">{icon}</span>
    <strong>{value}</strong>
    <span className="recipe-detail-stat-label">{label}</span>
  </div>
);

const RecipeDetailPopup: React.FC<RecipeDetailPopupProps> = ({
  recipe,
  isFavorite,
  isFavoritePending,
  onClose,
  onToggleFavorite,
  onAddMissingToShopping,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const ingredients = useMemo(() => {
    const byId = new Map<number, RecipeIngredientFromApi>();
    recipe.matchedIngredients.forEach((item) => byId.set(item.foodId, item));
    recipe.missingIngredients.forEach((item) => {
      if (!byId.has(item.foodId)) byId.set(item.foodId, item);
    });
    return Array.from(byId.values());
  }, [recipe]);

  const [checkedIds, setCheckedIds] = useState<Set<number>>(
    () => new Set(ingredients.filter((item) => item.sufficientQuantity).map((item) => item.foodId))
  );

  const toggleChecked = (foodId: number) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(foodId)) next.delete(foodId);
      else next.add(foodId);
      return next;
    });
  };

  const steps = useMemo(() => splitInstructions(recipe.instructions), [recipe.instructions]);
  const missingIngredients = recipe.missingIngredients;
  const showImage = Boolean(recipe.imageUrl) && !imageFailed;

  return (
    <div className="recipe-detail-overlay" onClick={onClose}>
      <section className="recipe-detail-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="recipe-detail-hero">
          {showImage ? (
            <img src={recipe.imageUrl} alt={recipe.name} onError={() => setImageFailed(true)} />
          ) : (
            <span className="recipe-detail-hero-emoji" aria-hidden="true">
              {recipeEmoji(recipe.name)}
            </span>
          )}

          <div className="recipe-detail-hero-actions">
            <button
              type="button"
              className={`recipe-detail-heart ${isFavorite ? "active" : ""}`}
              aria-label={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
              aria-pressed={isFavorite}
              disabled={isFavoritePending}
              onClick={() => onToggleFavorite(recipe)}
            >
              <Heart filled={isFavorite} />
            </button>
            <button type="button" className="recipe-detail-close" aria-label="Đóng" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="recipe-detail-hero-caption">
            <div className="recipe-detail-hero-tags">
              <span className="recipe-detail-meal">{mealTimeLabel(recipe.preferredMealTime)}</span>
              <span className={`recipe-detail-diff ${difficultyClass(recipe.difficulty)}`}>
                {difficultyLabel(recipe.difficulty)}
              </span>
            </div>
            <h2>{recipe.name}</h2>
            {recipe.description && <p>{recipe.description}</p>}
          </div>
        </div>

        <div className="recipe-detail-body">
          <div className="recipe-detail-stats">
            <Stat
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              }
              value={recipe.cookingTimeMinutes ? `${recipe.cookingTimeMinutes}'` : "—"}
              label="Thời gian"
            />
            <Stat
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
                  <circle cx="9" cy="7" r="3" />
                  <path d="M22 19v-1a4 4 0 0 0-3-3.85" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              value={recipe.servings ? `${recipe.servings}` : "—"}
              label="Khẩu phần"
            />
            <Stat
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              }
              value={recipe.calories ? `${recipe.calories}` : "—"}
              label="Kcal"
            />
            <Stat
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
              }
              value={`${recipe.ingredientCount}`}
              label="Nguyên liệu"
            />
          </div>

          {/* Section nguyên liệu — bọc trong card lớn */}
          <section className="recipe-detail-section">
            <div className="recipe-detail-section-head">
              <h3>Nguyên liệu</h3>
              <span className={`recipe-detail-match-pill ${recipe.coveragePercent > 90 ? "high" : recipe.coveragePercent >= 50 ? "medium" : "low"}`}>
                Khớp {recipe.coveragePercent}%
              </span>
            </div>

            <div className="recipe-detail-ingredients-card">
              <div className="recipe-detail-ingredients">
                {ingredients.map((item) => {
                  const checked = checkedIds.has(item.foodId);
                  const available = item.sufficientQuantity;
                  const statusClass = item.expiringSoon ? "expired" : available ? "available" : "missing";

                  return (
                    <label
                      className={`recipe-detail-ingredient ${statusClass}`}
                      key={item.foodId}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleChecked(item.foodId)} />
                      <span className="recipe-detail-ingredient-check" aria-hidden="true" />
                      <span className="recipe-detail-ingredient-main">
                        <strong>{item.foodName}</strong>
                        <small>
                          Cần {formatQuantity(item.requiredQuantity, item.requiredUnit)}
                          {item.availableQuantity !== undefined && item.availableQuantity !== null
                            ? ` · Có ${formatQuantity(item.availableQuantity, item.availableUnit)}`
                            : ""}
                        </small>
                      </span>
                      <span className={`recipe-detail-ingredient-status ${statusClass}`}>
                        {item.expiringSoon ? "Sắp hết hạn" : available ? "Khả dụng" : "Thiếu"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section các bước — bọc trong card lớn */}
          <section className="recipe-detail-section">
            <h3>Các bước thực hiện</h3>
            <div className="recipe-detail-steps-card">
              {steps.length > 0 ? (
                <ol className="recipe-detail-steps">
                  {steps.map((step, index) => (
                    <li key={index}>
                      <span className="recipe-detail-step-no">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="recipe-detail-empty">Chưa có hướng dẫn nấu cho món này.</p>
              )}
            </div>
          </section>
        </div>

        <footer className="recipe-detail-footer">
          <p>
            {missingIngredients.length > 0
              ? `${missingIngredients.length} nguyên liệu còn thiếu`
              : "Đã đủ nguyên liệu để nấu món này"}
          </p>
          <button
            type="button"
            className="recipe-detail-shop-button"
            disabled={missingIngredients.length === 0}
            onClick={() => onAddMissingToShopping(recipe, missingIngredients)}
          >
            Thêm nguyên liệu thiếu vào danh sách đi chợ
          </button>
        </footer>
      </section>
    </div>
  );
};

export default RecipeDetailPopup;
