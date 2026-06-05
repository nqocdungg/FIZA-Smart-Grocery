import api from "@/services/api";
import type { RecipeFromApi } from "./recipeTypes";

// Gợi ý món ăn: chỉ các công thức tận dụng được thực phẩm trong tủ.
export const fetchRecipeSuggestions = async (limit = 30): Promise<RecipeFromApi[]> => {
  const response = await api.get<RecipeFromApi[]>("/api/fridge-items/recipe-suggestions", {
    params: { limit },
  });
  return response.data;
};

// Thư viện công thức: toàn bộ công thức kèm phần trăm khớp với tủ lạnh.
export const fetchRecipeLibrary = async (limit = 100): Promise<RecipeFromApi[]> => {
  const response = await api.get<RecipeFromApi[]>("/api/fridge-items/recipe-library", {
    params: { limit },
  });
  return response.data;
};

export const fetchFavoriteRecipeIds = async (): Promise<number[]> => {
  const response = await api.get<number[]>("/api/recipes/favorites");
  return response.data;
};

export const addFavoriteRecipe = async (recipeId: number): Promise<void> => {
  await api.post(`/api/recipes/${recipeId}/favorite`);
};

export const removeFavoriteRecipe = async (recipeId: number): Promise<void> => {
  await api.delete(`/api/recipes/${recipeId}/favorite`);
};
