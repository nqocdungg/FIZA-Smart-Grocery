import React from 'react';
import { ChevronDown } from 'lucide-react';

export type RecipeViewFilter = 'all' | 'favorites';

interface RecipeCatalogFiltersProps {
  activeView: RecipeViewFilter;
  selectedMealTime: string;
  mealTimeOptions: string[];
  onViewChange: (value: RecipeViewFilter) => void;
  onMealTimeChange: (value: string) => void;
}

const formatMealTime = (mealTime: string) => {
  const labels: Record<string, string> = {
    BREAKFAST: 'Bữa sáng',
    LUNCH: 'Bữa trưa',
    DINNER: 'Bữa tối',
    SNACK: 'Ăn nhẹ',
  };

  return labels[mealTime] || mealTime;
};

const RecipeCatalogFilters: React.FC<RecipeCatalogFiltersProps> = ({
  activeView,
  selectedMealTime,
  mealTimeOptions,
  onViewChange,
  onMealTimeChange,
}) => {
  return (
    <section className="recipe-catalog-filters" aria-label="Bộ lọc món ăn">
      <button
        className={activeView === 'all' ? 'active' : ''}
        type="button"
        onClick={() => onViewChange('all')}
      >
        Tất cả
      </button>
      <button
        className={activeView === 'favorites' ? 'active' : ''}
        type="button"
        onClick={() => onViewChange('favorites')}
      >
        Yêu thích
      </button>

      <label className="recipe-catalog-select">
        <span>Phân loại món</span>
        <select value={selectedMealTime} onChange={(event) => onMealTimeChange(event.target.value)}>
          <option value="all">Phân loại món</option>
          {mealTimeOptions.map((mealTime) => (
            <option key={mealTime} value={mealTime}>
              {formatMealTime(mealTime)}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" size={14} strokeWidth={2.4} />
      </label>
    </section>
  );
};

export default RecipeCatalogFilters;
