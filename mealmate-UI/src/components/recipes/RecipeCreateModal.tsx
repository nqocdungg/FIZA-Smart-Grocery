import React, { useEffect, useState } from 'react';
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import type { CreateRecipePayload, FoodOption } from '@/features/recipes/recipeApi';

interface IngredientDraft {
  foodId: string;
  quantity: string;
  unit: string;
}

interface RecipeCreateModalProps {
  isOpen: boolean;
  foods: FoodOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRecipePayload, image?: File | null) => void;
}

const emptyIngredient: IngredientDraft = {
  foodId: '',
  quantity: '',
  unit: '',
};

const RecipeCreateModal: React.FC<RecipeCreateModalProps> = ({
  isOpen,
  foods,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [preferredMealTime, setPreferredMealTime] = useState('LUNCH');
  const [cookingTimeMinutes, setCookingTimeMinutes] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([{ ...emptyIngredient }]);
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setInstructions('');
      setPreferredMealTime('LUNCH');
      setCookingTimeMinutes('');
      setIngredients([{ ...emptyIngredient }]);
      setImage(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const updateIngredient = (index: number, nextValue: Partial<IngredientDraft>) => {
    setIngredients((current) =>
      current.map((ingredient, currentIndex) =>
        currentIndex === index ? { ...ingredient, ...nextValue } : ingredient
      )
    );
  };

  const selectedFood = (foodId: string) => foods.find((food) => food.id === Number(foodId));

  const handleFoodChange = (index: number, foodId: string) => {
    const food = selectedFood(foodId);
    updateIngredient(index, {
      foodId,
      unit: food?.unit || '',
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit(
      {
        name: name.trim(),
        instructions: instructions.trim(),
        preferredMealTime,
        cookingTimeMinutes: cookingTimeMinutes ? Number(cookingTimeMinutes) : undefined,
        ingredients: ingredients
          .filter((ingredient) => ingredient.foodId && ingredient.quantity)
          .map((ingredient) => ({
            foodId: Number(ingredient.foodId),
            quantity: Number(ingredient.quantity),
            unit: ingredient.unit.trim(),
          })),
      },
      image
    );
  };

  return (
    <div className="recipe-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="recipe-create-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="recipe-modal-close" type="button" aria-label="Đóng" onClick={onClose}>
          <X aria-hidden="true" size={20} />
        </button>

        <form onSubmit={handleSubmit}>
          <header>
            <h2>Thêm công thức nấu ăn</h2>
          </header>

          <div className="recipe-create-grid">
            <label>
              <span>Tên món</span>
              <input required value={name} onChange={(event) => setName(event.target.value)} />
            </label>

            <label>
              <span>Bữa ưu tiên</span>
              <select value={preferredMealTime} onChange={(event) => setPreferredMealTime(event.target.value)}>
                <option value="BREAKFAST">Bữa sáng</option>
                <option value="LUNCH">Bữa trưa</option>
                <option value="DINNER">Bữa tối</option>
                <option value="SNACK">Ăn nhẹ</option>
              </select>
            </label>
            <label>
              <span>Thoi gian nau (phut)</span>
              <input min="1" type="number" value={cookingTimeMinutes} onChange={(event) => setCookingTimeMinutes(event.target.value)} />
            </label>
          </div>

          <label className="recipe-create-instructions">
            <span>Công thức nấu ăn chi tiết</span>
            <textarea required rows={6} value={instructions} onChange={(event) => setInstructions(event.target.value)} />
          </label>

          <label className="recipe-create-upload">
            <ImagePlus aria-hidden="true" size={20} />
            <span>{image ? image.name : 'Upload ảnh món ăn'}</span>
            <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} />
          </label>

          <section className="recipe-create-ingredients">
            <div className="recipe-create-section-header">
              <h3>Nguyên liệu</h3>
              <button type="button" onClick={() => setIngredients((current) => [...current, { ...emptyIngredient }])}>
                <Plus aria-hidden="true" size={16} />
                Thêm dòng
              </button>
            </div>

            {ingredients.map((ingredient, index) => (
              <div className="recipe-create-ingredient-row" key={index}>
                <select required value={ingredient.foodId} onChange={(event) => handleFoodChange(index, event.target.value)}>
                  <option value="">Chọn nguyên liệu</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name}
                    </option>
                  ))}
                </select>
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  placeholder="Số lượng"
                  value={ingredient.quantity}
                  onChange={(event) => updateIngredient(index, { quantity: event.target.value })}
                />
                <input
                  placeholder="Đơn vị"
                  value={ingredient.unit}
                  onChange={(event) => updateIngredient(index, { unit: event.target.value })}
                />
                <button
                  type="button"
                  aria-label="Xóa nguyên liệu"
                  disabled={ingredients.length === 1}
                  onClick={() => setIngredients((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                >
                  <Trash2 aria-hidden="true" size={16} />
                </button>
              </div>
            ))}
          </section>

          <footer>
            <button type="button" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu công thức'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default RecipeCreateModal;
