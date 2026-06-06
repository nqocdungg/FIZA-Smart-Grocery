import React from 'react';
import type { RecipeCatalogItem } from '@/features/recipes/recipeApi';
import RecipeCard from './RecipeCard';

interface RecipeGridProps {
  recipes: RecipeCatalogItem[];
  updatingFavoriteIds: Set<number>;
  onToggleFavorite: (recipe: RecipeCatalogItem) => void;
  onOpenRecipe: (recipe: RecipeCatalogItem) => void;
}

const RecipeGrid: React.FC<RecipeGridProps> = ({
  recipes,
  updatingFavoriteIds,
  onToggleFavorite,
  onOpenRecipe,
}) => {
  if (!recipes.length) {
    return (
      <div className="recipe-catalog-empty">
        <h2>Không tìm thấy món ăn</h2>
        <p>Thử đổi từ khóa tìm kiếm hoặc bỏ bộ lọc yêu thích.</p>
      </div>
    );
  }

  return (
    <div className="recipe-catalog-grid">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          isFavoriteUpdating={updatingFavoriteIds.has(recipe.id)}
          onToggleFavorite={onToggleFavorite}
          onOpen={onOpenRecipe}
        />
      ))}
    </div>
  );
};

export default RecipeGrid;
