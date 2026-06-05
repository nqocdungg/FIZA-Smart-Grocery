import React, { useState } from "react";
import "./RecipeCard.css";

import {
  coverageTone,
  difficultyClass,
  difficultyLabel,
  mealTimeLabel,
  recipeEmoji,
  type RecipeFromApi,
} from "./recipeTypes";

type RecipeBrowserVariant = "suggestion" | "library";

type RecipeCardProps = {
  recipe: RecipeFromApi;
  variant?: RecipeBrowserVariant;
  isFavorite: boolean;
  isFavoritePending?: boolean;
  animationDelay?: number;
  onOpen: (recipe: RecipeFromApi) => void;
  onToggleFavorite: (recipe: RecipeFromApi) => void;
};

const IconClock = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconServings = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
    <circle cx="9" cy="7" r="3" />
    <path d="M22 19v-1a4 4 0 0 0-3-3.85" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconIngredients = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

const IconCalories = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const Heart: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  variant = "suggestion",
  isFavorite,
  isFavoritePending,
  animationDelay = 0,
  onOpen,
  onToggleFavorite,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const tone = coverageTone(recipe.coveragePercent);
  const showImage = Boolean(recipe.imageUrl) && !imageFailed;
  const hasExpiringIngredients = recipe.expiringIngredients.length > 0;
  const isLibrary = variant === "library";

  return (
    <article
      className="recipe-card recipe-card-enter"
      style={{ animationDelay: `${animationDelay}ms` }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(recipe)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(recipe);
        }
      }}
    >
      <div className="recipe-card-media">
        {showImage ? (
          <img src={recipe.imageUrl} alt={recipe.name} loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <span className="recipe-card-media-emoji" aria-hidden="true">
            {recipeEmoji(recipe.name)}
          </span>
        )}

        {/* % khớp: chỉ hiển thị ở trang Gợi ý */}
        {!isLibrary && (
          <span className={`recipe-card-match ${tone}`}>
            <strong>{recipe.coveragePercent}%</strong>
          </span>
        )}

        <button
          type="button"
          className={`recipe-card-heart ${isFavorite ? "active" : ""}`}
          aria-label={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
          aria-pressed={isFavorite}
          disabled={isFavoritePending}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(recipe);
          }}
        >
          <Heart filled={isFavorite} />
        </button>

        {/* Badge trạng thái: chỉ hiển thị ở trang Gợi ý */}
        {!isLibrary && (
          <span className={`recipe-card-status ${hasExpiringIngredients ? "expired" : recipe.canCook ? "ready" : "partial"}`}>
            {hasExpiringIngredients ? "Sắp hết hạn" : recipe.canCook ? "Nấu được ngay" : "Cần bổ sung"}
          </span>
        )}
      </div>

      <div className="recipe-card-body">
        <div className="recipe-card-heading">
          <h3 title={recipe.name}>{recipe.name}</h3>
          <span className="recipe-card-meal">{mealTimeLabel(recipe.preferredMealTime)}</span>
        </div>

        {/* Description: luôn giữ chỗ để căn chỉnh đồng nhất giữa các thẻ */}
        <p className="recipe-card-desc">
          {recipe.description || ""}
        </p>

        <div className="recipe-card-meta">
          <span className="recipe-card-meta-item">
            <IconClock />
            {recipe.cookingTimeMinutes ? `${recipe.cookingTimeMinutes} phút` : "—"}
          </span>
          <span className="recipe-card-meta-item">
            <IconServings />
            {recipe.servings ? `${recipe.servings} người` : "—"}
          </span>
          <span className="recipe-card-meta-item">
            <IconIngredients />
            {recipe.ingredientCount} nguyên liệu
          </span>
          <span className="recipe-card-meta-item">
            <IconCalories />
            {recipe.calories ? `${recipe.calories} kcal` : "—"}
          </span>
        </div>

        <div className="recipe-card-footer">
          <span className={`recipe-card-diff ${difficultyClass(recipe.difficulty)}`}>
            {difficultyLabel(recipe.difficulty)}
          </span>
          <div className="recipe-card-coverage">
            <div className={`recipe-card-coverage-track ${tone}`}>
              <div className="recipe-card-coverage-bar" style={{ width: `${recipe.coveragePercent}%` }} />
            </div>
            <span>
              {recipe.matchedIngredients.length}/{recipe.ingredientCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default RecipeCard;
