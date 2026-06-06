import React from 'react';
import { BookOpenText, ChefHat, ImageIcon, PlayCircle, Soup, X } from 'lucide-react';
import type { RecipeDetail } from '@/features/recipes/recipeApi';

interface RecipeDetailModalProps {
  recipe: RecipeDetail | null;
  isLoading: boolean;
  onClose: () => void;
}

const formatAmount = (quantity: number, unit?: string | null) => {
  const formattedQuantity = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
  if (!unit) {
    return formattedQuantity;
  }

  const compactUnits = new Set(['g', 'kg', 'mg', 'ml', 'l']);
  return compactUnits.has(unit.toLowerCase()) ? `${formattedQuantity}${unit}` : `${formattedQuantity} ${unit}`;
};

const splitInstructions = (instructions?: string | null) => {
  if (!instructions?.trim()) {
    return [];
  }

  return instructions
    .split(/\n{2,}|\r\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
};

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, isLoading, onClose }) => {
  if (!recipe && !isLoading) {
    return null;
  }

  const instructionBlocks = splitInstructions(recipe?.instructions);

  return (
    <div className="recipe-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="recipe-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={recipe ? 'recipe-detail-title' : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="recipe-modal-close" type="button" aria-label="Đóng" onClick={onClose}>
          <X aria-hidden="true" size={20} />
        </button>

        {isLoading && <div className="recipe-modal-loading">Đang tải chi tiết công thức...</div>}

        {!isLoading && recipe && (
          <div className="recipe-detail-fg">
            <header className="recipe-detail-fg-header">
              <div className="recipe-detail-fg-image">
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.name} />
                ) : (
                  <div>
                    <ImageIcon aria-hidden="true" size={30} />
                    <span>Chưa có ảnh</span>
                  </div>
                )}
              </div>
              <div>
                <p>{recipe.preferredMealTime || recipe.displayStatus || 'Công thức'}</p>
                <h2 id="recipe-detail-title">{recipe.name}</h2>
              </div>
            </header>

            <section className="recipe-fg-section">
              <div className="recipe-fg-heading">
                <Soup aria-hidden="true" size={24} strokeWidth={2.4} />
                <h3>Nguyên liệu</h3>
              </div>

              {recipe.ingredients.length ? (
                <ul className="recipe-fg-ingredients">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={`${ingredient.foodId}-${ingredient.foodName}`}>
                      <span>{ingredient.foodName}</span>
                      <strong>{formatAmount(ingredient.quantity, ingredient.unit)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="recipe-fg-empty">Chưa có nguyên liệu.</p>
              )}
            </section>

            <section className="recipe-fg-section recipe-method-section">
              <div className="recipe-fg-heading">
                <ChefHat aria-hidden="true" size={24} strokeWidth={2.4} />
                <h3>Cách chế biến</h3>
              </div>

              {instructionBlocks.length ? (
                <div className="recipe-fg-instructions">
                  {instructionBlocks.map((block, index) => (
                    <p key={index}>{block}</p>
                  ))}
                </div>
              ) : (
                <p className="recipe-fg-empty">Chưa có hướng dẫn nấu ăn chi tiết.</p>
              )}
            </section>

            {recipe.referenceLink ? (
              <div className="recipe-video-block">
                <a href={recipe.referenceLink} target="_blank" rel="noreferrer">
                  <PlayCircle aria-hidden="true" size={22} fill="currentColor" />
                  <span>Xem video hướng dẫn<br />chi tiết</span>
                </a>
              </div>
            ) : (
              <div className="recipe-video-block muted">
                <BookOpenText aria-hidden="true" size={22} />
                <span>Chưa có video hướng dẫn<br />chi tiết</span>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default RecipeDetailModal;
