import React from 'react';
import { Clock3, Heart, ImageIcon } from 'lucide-react';
import type { RecipeCatalogItem } from '@/features/recipes/recipeApi';

interface RecipeCardProps {
  recipe: RecipeCatalogItem;
  isFavoriteUpdating: boolean;
  onToggleFavorite: (recipe: RecipeCatalogItem) => void;
  onOpen: (recipe: RecipeCatalogItem) => void;
}

const getImageUrl = (recipe: RecipeCatalogItem) => {
  const imageUrl = recipe.imageUrl?.trim();
  return imageUrl || '';
};

const formatIngredients = (ingredients: string[]) => {
  if (!ingredients.length) {
    return 'Đang cập nhật nguyên liệu';
  }

  return ingredients.join(', ');
};

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isFavoriteUpdating,
  onToggleFavorite,
  onOpen,
}) => {
  return (
    <article
      className="recipe-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(recipe)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(recipe);
        }
      }}
    >
      <div className="recipe-card-image-wrap">
        {getImageUrl(recipe) ? (
          <img className="recipe-card-image" src={getImageUrl(recipe)} alt={recipe.name} loading="lazy" />
        ) : (
          <div className="recipe-card-image-placeholder">
            <ImageIcon aria-hidden="true" size={28} strokeWidth={2.2} />
            <span>Chưa có ảnh</span>
          </div>
        )}
        <button
          className={`recipe-card-favorite ${recipe.favorite ? 'active' : ''}`}
          type="button"
          aria-label={recipe.favorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          disabled={isFavoriteUpdating}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(recipe);
          }}
        >
          <Heart aria-hidden="true" size={20} strokeWidth={2.5} fill="currentColor" />
        </button>
        {recipe.cookingTimeMinutes ? (
          <div className="recipe-card-meta">
            <span>
              <Clock3 aria-hidden="true" size={12} strokeWidth={2.5} />
              {recipe.cookingTimeMinutes}'
            </span>
          </div>
        ) : null}
      </div>

      <div className="recipe-card-body">
        <h2>{recipe.name}</h2>
        <p>{formatIngredients(recipe.ingredients)}</p>
      </div>
    </article>
  );
};

export default RecipeCard;
