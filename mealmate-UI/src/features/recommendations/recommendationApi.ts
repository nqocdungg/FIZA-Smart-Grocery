import api from "@/services/api";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";
export type MenuGenerateMode = "DAY" | "WEEK";

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export type FamilyInfo = {
  id: number;
  familyId?: number;
  name: string;
};

export type CurrentUserInfo = {
  id: number;
  userId?: number;
  fullName?: string;
  email?: string;
  familyId?: number;
};

export type IngredientAvailabilityDto = {
  foodId: number;
  name: string;
  requiredQuantity: number;
  availableQuantity: number;
  unit?: string;
};

export type MissingIngredientDto = {
  foodId: number;
  name: string;
  requiredQuantity: number;
  missingQuantity: number;
  unit?: string;
};

export type RecipeRecommendation = {
  recipeId: number;
  recipeName: string;
  imageUrl?: string;
  score: number;
  matchPercent: number;
  availableIngredients: IngredientAvailabilityDto[];
  missingIngredients: MissingIngredientDto[];
  reasons: string[];
};

export type RecommendationResponse = {
  familyId: number;
  userId: number;
  mealType: MealType;
  date: string;
  recommendations: RecipeRecommendation[];
};

export type MenuDraftMeal = {
  mealType: MealType;
  recommendation: RecipeRecommendation | null;
};

export type MenuDraftDay = {
  date: string;
  meals: MenuDraftMeal[];
};

export type MenuDraftResponse = {
  familyId: number;
  userId: number;
  mode: MenuGenerateMode;
  startDate: string;
  endDate: string;
  days: MenuDraftDay[];
};

export type AddRecommendationToMealRequest = {
  familyId: number;
  mealType: MealType;
  date: string;
  status: "SUGGESTED" | "CONFIRMED";
};

export type UpdateMealItemRequest = AddRecommendationToMealRequest & {
  userId: number;
  recipeId: number;
};

export type AddMissingIngredientsToShoppingListRequest = {
  familyId: number;
  userId: number;
  date: string;
  plannedDate?: string;
  note?: string;
};

export type AddMissingIngredientsToShoppingListResponse = {
  shoppingListId: number;
  recipeId: number;
  addedItemCount: number;
  addedItems: MissingIngredientDto[];
};

export type MenuPlanRecipe = {
  mealItemId: number;
  recipeId: number;
  recipeName: string;
  imageUrl?: string;
  status?: string;
};

export type MenuPlanMeal = {
  mealType: MealType;
  recipes: MenuPlanRecipe[];
};

export type MenuPlanDay = {
  date: string;
  meals: MenuPlanMeal[];
};

export type MenuPlanResponse = {
  familyId: number;
  userId: number;
  startDate: string;
  endDate: string;
  days: MenuPlanDay[];
};

const unwrapEnvelope = <T>(payload: T | ApiEnvelope<T>): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
};

const normalizeFamilyInfo = (payload: FamilyInfo): FamilyInfo => {
  const id = payload.id ?? payload.familyId;
  return {
    ...payload,
    id,
    name: payload.name || "Gia đình",
  };
};

const readStoredAuthUser = (): { userId?: number; id?: number; familyId?: number } | null => {
  try {
    const storedUser = localStorage.getItem("authUser");
    if (!storedUser) return null;
    return JSON.parse(storedUser) as { userId?: number; id?: number; familyId?: number };
  } catch {
    return null;
  }
};

const getCurrentUserInfo = async () => {
  const response = await api.get<CurrentUserInfo | ApiEnvelope<CurrentUserInfo>>("/api/v1/users/users/current");
  return unwrapEnvelope<CurrentUserInfo>(response.data);
};

export const recommendationApi = {
  async getCurrentFamily() {
    const response = await api.get<FamilyInfo | ApiEnvelope<FamilyInfo>>("/api/v1/users/familys/current");
    const family = unwrapEnvelope<FamilyInfo>(response.data);

    if (family && Number.isFinite(family.id ?? family.familyId)) {
      return normalizeFamilyInfo(family);
    }

    const currentUser = await getCurrentUserInfo().catch(() => null);
    if (currentUser?.familyId && Number.isFinite(currentUser.familyId)) {
      return normalizeFamilyInfo({
        id: currentUser.familyId,
        familyId: currentUser.familyId,
        name: "Gia đình",
      });
    }

    const storedUser = readStoredAuthUser();
    if (storedUser?.familyId && Number.isFinite(storedUser.familyId)) {
      return normalizeFamilyInfo({
        id: storedUser.familyId,
        familyId: storedUser.familyId,
        name: "Gia đình",
      });
    }

    throw new Error("Tài khoản hiện tại chưa thuộc gia đình nào hoặc endpoint current-family không trả familyId.");
  },

  async recommendRecipes(params: {
    familyId: number;
    userId: number;
    mealType: MealType;
    date: string;
    limit?: number;
  }) {
    const response = await api.get<RecommendationResponse>("/api/recommendations/recipes", { params });
    return response.data;
  },

  async getMenuPlan(params: {
    familyId: number;
    userId: number;
    startDate: string;
    endDate: string;
  }) {
    const response = await api.get<MenuPlanResponse>("/api/recommendations/menu-plan", { params });
    return response.data;
  },

  async generateMenuDraft(payload: {
    familyId: number;
    userId: number;
    startDate: string;
    mode: MenuGenerateMode;
    candidateLimit?: number;
  }) {
    try {
      const response = await api.post<MenuDraftResponse>("/api/recommendations/menu-draft", payload);
      return response.data;
    } catch (error) {
      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (responseMessage?.includes("No static resource")) {
        throw new Error("Backend hiện tại chưa nhận endpoint /api/recommendations/menu-draft. Hãy restart backend sau khi build code mới.");
      }
      throw error;
    }
  },

  async addRecommendationToMeal(recipeId: number, payload: AddRecommendationToMealRequest) {
    const response = await api.post(`/api/recommendations/${recipeId}/add-to-meal`, payload);
    return response.data;
  },

  async addMissingIngredientsToShoppingList(recipeId: number, payload: AddMissingIngredientsToShoppingListRequest) {
    const response = await api.post<AddMissingIngredientsToShoppingListResponse>(
      `/api/recommendations/${recipeId}/missing-ingredients/add-to-shopping-list`,
      payload
    );
    return response.data;
  },

  async updateMealItem(mealItemId: number, payload: UpdateMealItemRequest) {
    const response = await api.patch(`/api/recommendations/meal-items/${mealItemId}`, payload);
    return response.data;
  },

  async deleteMealItem(mealItemId: number, params: { familyId: number; userId: number }) {
    const response = await api.delete(`/api/recommendations/meal-items/${mealItemId}`, { params });
    return response.data;
  },
};
