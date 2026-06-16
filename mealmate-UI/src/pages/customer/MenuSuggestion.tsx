import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Edit3,
  Info,
  Loader2,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import "./MenuSuggestion.css";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import {
  recommendationApi,
  type FamilyInfo,
  type MealType,
  type MenuGenerateMode,
  type MenuPlanDay,
  type MenuPlanMeal,
  type MenuPlanRecipe,
  type RecipeRecommendation,
} from "@/features/recommendations/recommendationApi";
import { fetchRecipeCatalog, type RecipeCatalogItem } from "@/features/recipes/recipeApi";
import RecipeDetailPopup from "./recipes/RecipeDetailPopup";
import {
  addFavoriteRecipe,
  fetchFavoriteRecipeIds,
  fetchRecipeLibrary as fetchFridgeRecipeLibrary,
  removeFavoriteRecipe,
} from "./recipes/recipeApi";
import type { RecipeFromApi, RecipeIngredientFromApi } from "./recipes/recipeTypes";
import { addPendingShoppingItems } from "@/features/shopping-plan/shoppingSuggestions";

type ToastState = {
  message: string;
  variant: "success" | "error";
};

type DraftMealSlot = {
  id: string;
  recommendation: RecipeRecommendation | null;
  existingMealItemId?: number;
  originalRecipeId?: number;
};

type DraftMeal = {
  mealType: MealType;
  slots: DraftMealSlot[];
};

type DraftDay = {
  date: string;
  meals: DraftMeal[];
};

type EditMealForm = {
  mealItemId: number;
  currentRecipeId: number;
  selectedRecipeId: number | null;
  mealType: MealType;
  date: string;
  originalMealType: MealType;
  originalDate: string;
  originalRecipeName: string;
  status: "SUGGESTED" | "CONFIRMED";
  recipeName: string;
};

type DraftPickerTarget = {
  date: string;
  mealType: MealType;
  slotId: string;
};

const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];

const mealMeta: Record<MealType, { label: string; time: string; icon: React.ReactNode; accent: string }> = {
  BREAKFAST: {
    label: "Bữa sáng",
    time: "07:00",
    icon: <Coffee size={20} />,
    accent: "#ffdbcb",
  },
  LUNCH: {
    label: "Bữa trưa",
    time: "12:30",
    icon: <Sun size={20} />,
    accent: "rgba(109, 212, 180, 0.2)",
  },
  DINNER: {
    label: "Bữa tối",
    time: "19:00",
    icon: <Moon size={20} />,
    accent: "rgba(121, 64, 29, 0.1)",
  },
};

const getMealDisplayLabel = (mealType?: string | null) => {
  if (mealType === "BREAKFAST" || mealType === "LUNCH" || mealType === "DINNER") {
    return mealMeta[mealType].label;
  }

  return mealType || "Món tự chọn";
};

const weekdayShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const weekdayLong = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

const toDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateOnly = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const getWeekStart = (date: Date) => {
  const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  return nextDate;
};

const formatDisplayDate = (dateString: string) => {
  const date = parseDateOnly(dateString);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getAuthUserId = (contextUserId?: number) => {
  if (contextUserId) return contextUserId;

  try {
    const storedUser = localStorage.getItem("authUser");
    if (!storedUser) return null;
    const parsed = JSON.parse(storedUser) as { userId?: number; id?: number };
    return parsed.userId || parsed.id || null;
  } catch {
    return null;
  }
};

const hasSavedRecipes = (days: MenuPlanDay[]) =>
  days.some((day) => day.meals.some((meal) => meal.recipes.length > 0));

const getMealFromDay = (day: MenuPlanDay | undefined, mealType: MealType): MenuPlanMeal => {
  const meal = day?.meals.find((item) => item.mealType === mealType);
  return meal || { mealType, recipes: [] };
};

const getRecipeInitial = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const createDraftSlotId = (date: string, mealType: MealType, suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`) => {
  return `${date}-${mealType}-${suffix}`;
};

const createDraftSlot = (
  date: string,
  mealType: MealType,
  suffix: string,
  recommendation: RecipeRecommendation | null = null,
  existingMealItemId?: number,
  originalRecipeId?: number
): DraftMealSlot => ({
  id: createDraftSlotId(date, mealType, suffix),
  recommendation,
  existingMealItemId,
  originalRecipeId,
});

const createEmptyDraftDays = (startDate: string, mode: MenuGenerateMode): DraftDay[] => {
  const totalDays = mode === "WEEK" ? 7 : 1;
  const start = parseDateOnly(startDate);

  return Array.from({ length: totalDays }, (_, dayIndex) => ({
    date: toDateOnly(addDays(start, dayIndex)),
    meals: mealTypes.map((mealType) => {
      const date = toDateOnly(addDays(start, dayIndex));
      return {
        mealType,
        slots: [createDraftSlot(date, mealType, "empty")],
      };
    }),
  }));
};

const menuPlanRecipeToRecommendation = (recipe: MenuPlanRecipe): RecipeRecommendation => ({
  recipeId: recipe.recipeId,
  recipeName: recipe.recipeName,
  imageUrl: recipe.imageUrl,
  score: 0,
  matchPercent: 0,
  availableIngredients: [],
  missingIngredients: [],
  reasons: ["Món đã có trong thực đơn"],
});

const createDraftDaysFromMenuPlan = (startDate: string, mode: MenuGenerateMode, savedMenuDays: MenuPlanDay[]): DraftDay[] => {
  return createEmptyDraftDays(startDate, mode).map((draftDay) => {
    const savedDay = savedMenuDays.find((day) => day.date === draftDay.date);

    return {
      ...draftDay,
      meals: draftDay.meals.map((draftMeal) => {
        const savedRecipes = getMealFromDay(savedDay, draftMeal.mealType).recipes;
        if (savedRecipes.length === 0) return draftMeal;

        return {
          ...draftMeal,
          slots: savedRecipes.map((savedRecipe, recipeIndex) =>
            createDraftSlot(
              draftDay.date,
              draftMeal.mealType,
              `saved-${savedRecipe.mealItemId || recipeIndex}`,
              menuPlanRecipeToRecommendation(savedRecipe),
              savedRecipe.mealItemId,
              savedRecipe.recipeId
            )
          ),
        };
      }),
    };
  });
};

const createDraftDaysFromGeneratedPlan = (startDate: string, mode: MenuGenerateMode, generatedDays: { date: string; meals: { mealType: MealType; recommendation: RecipeRecommendation | null }[] }[]): DraftDay[] => {
  const emptyDays = createEmptyDraftDays(startDate, mode);

  return emptyDays.map((emptyDay) => {
    const generatedDay = generatedDays.find((day) => day.date === emptyDay.date);

    return {
      ...emptyDay,
      meals: emptyDay.meals.map((emptyMeal) => {
        const generatedMeal = generatedDay?.meals.find((meal) => meal.mealType === emptyMeal.mealType);
        return {
          ...emptyMeal,
          slots: [
            {
              ...emptyMeal.slots[0],
              recommendation: generatedMeal?.recommendation ?? null,
            },
          ],
        };
      }),
    };
  });
};

const mergeGeneratedDraftWithSavedDraft = (generatedDays: DraftDay[], savedDraftDays: DraftDay[]): DraftDay[] => {
  return generatedDays.map((generatedDay) => {
    const savedDay = savedDraftDays.find((day) => day.date === generatedDay.date);

    return {
      ...generatedDay,
      meals: generatedDay.meals.map((generatedMeal) => {
        const savedMeal = savedDay?.meals.find((meal) => meal.mealType === generatedMeal.mealType);
        if (!savedMeal) return generatedMeal;
        if (savedMeal.slots.some((slot) => slot.recommendation || slot.existingMealItemId)) return savedMeal;

        return {
          ...generatedMeal,
          slots: generatedMeal.slots.map((slot, index) => ({
            ...slot,
            recommendation: slot.recommendation || savedMeal.slots[index]?.recommendation || null,
            existingMealItemId: savedMeal.slots[index]?.existingMealItemId,
            originalRecipeId: savedMeal.slots[index]?.originalRecipeId,
          })),
        };
      }),
    };
  });
};

const catalogRecipeToRecommendation = (recipe: RecipeCatalogItem): RecipeRecommendation => ({
  recipeId: recipe.id,
  recipeName: recipe.name,
  imageUrl: recipe.imageUrl || undefined,
  score: 0,
  matchPercent: 0,
  availableIngredients: [],
  missingIngredients: [],
  reasons: ["Người dùng tự chọn từ danh sách món ăn"],
});

const recommendationToDetailRecipe = (recipe: RecipeRecommendation, favorite: boolean): RecipeFromApi => {
  const matchedIngredients: RecipeIngredientFromApi[] = recipe.availableIngredients.map((item) => ({
    foodId: item.foodId,
    foodName: item.name,
    requiredQuantity: item.requiredQuantity,
    requiredUnit: item.unit,
    availableQuantity: item.availableQuantity,
    availableUnit: item.unit,
    sufficientQuantity: true,
    expiringSoon: false,
  }));

  const missingIngredients: RecipeIngredientFromApi[] = recipe.missingIngredients.map((item) => ({
    foodId: item.foodId,
    foodName: item.name,
    requiredQuantity: item.requiredQuantity,
    requiredUnit: item.unit,
    availableQuantity: Math.max(item.requiredQuantity - item.missingQuantity, 0),
    availableUnit: item.unit,
    sufficientQuantity: false,
    expiringSoon: false,
  }));

  return {
    recipeId: recipe.recipeId,
    name: recipe.recipeName,
    imageUrl: recipe.imageUrl,
    description: recipe.reasons.join(". ") || undefined,
    ingredientCount: matchedIngredients.length + missingIngredients.length,
    score: recipe.score,
    coveragePercent: recipe.matchPercent,
    canCook: missingIngredients.length === 0,
    favorite,
    matchedIngredients,
    missingIngredients,
    expiringIngredients: [],
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const MenuSuggestion: React.FC = () => {
  const { user } = useAuth();
  const userId = getAuthUserId(user?.userId);

  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => toDateOnly(new Date()));
  const [weekStartDate, setWeekStartDate] = useState(() => toDateOnly(getWeekStart(new Date())));
  const [menuDays, setMenuDays] = useState<MenuPlanDay[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftMode, setDraftMode] = useState<MenuGenerateMode>("WEEK");
  const [draftStartDate, setDraftStartDate] = useState(() => toDateOnly(new Date()));
  const [draftDays, setDraftDays] = useState<DraftDay[]>([]);
  const [isLoadingDraftPlan, setIsLoadingDraftPlan] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditMealForm | null>(null);
  const [editOptions, setEditOptions] = useState<RecipeRecommendation[]>([]);
  const [isLoadingEditOptions, setIsLoadingEditOptions] = useState(false);
  const [isUpdatingMealItem, setIsUpdatingMealItem] = useState(false);
  const [recipeCatalog, setRecipeCatalog] = useState<RecipeCatalogItem[]>([]);
  const [isLoadingRecipeCatalog, setIsLoadingRecipeCatalog] = useState(false);
  const [draftPickerTarget, setDraftPickerTarget] = useState<DraftPickerTarget | null>(null);
  const [draftPickerOptions, setDraftPickerOptions] = useState<RecipeRecommendation[]>([]);
  const [isLoadingDraftPickerOptions, setIsLoadingDraftPickerOptions] = useState(false);
  const [draftRecipeSearch, setDraftRecipeSearch] = useState("");
  const [recipeLibraryDetails, setRecipeLibraryDetails] = useState<RecipeFromApi[]>([]);
  const [detailRecipe, setDetailRecipe] = useState<RecipeFromApi | null>(null);
  const [detailRecipeDate, setDetailRecipeDate] = useState<string | null>(null);
  const [isLoadingDetailRecipe, setIsLoadingDetailRecipe] = useState(false);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<Set<number>>(new Set());
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<ToastState | null>(null);

  const weekDays = useMemo(() => {
    const start = parseDateOnly(weekStartDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [weekStartDate]);

  const selectedMenuDay = useMemo(() => {
    return menuDays.find((day) => day.date === selectedDate);
  }, [menuDays, selectedDate]);

  const selectedRecipeCount = useMemo(() => {
    return mealTypes.reduce((count, mealType) => count + getMealFromDay(selectedMenuDay, mealType).recipes.length, 0);
  }, [selectedMenuDay]);

  const weekRecipeCount = useMemo(() => {
    return menuDays.reduce((total, day) => {
      return total + day.meals.reduce((mealTotal, meal) => mealTotal + meal.recipes.length, 0);
    }, 0);
  }, [menuDays]);

  const showToast = useCallback((message: string, variant: ToastState["variant"]) => {
    setToast({ message, variant });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    fetchFavoriteRecipeIds()
      .then((ids) => setFavoriteRecipeIds(new Set(ids)))
      .catch(() => undefined);
  }, []);

  const loadRecipeCatalog = useCallback(async () => {
    if (recipeCatalog.length > 0) return recipeCatalog;

    setIsLoadingRecipeCatalog(true);
    try {
      const recipes = await fetchRecipeCatalog();
      setRecipeCatalog(recipes);
      return recipes;
    } catch (error) {
      showToast(getErrorMessage(error, "Không tải được danh sách món ăn."), "error");
      return [];
    } finally {
      setIsLoadingRecipeCatalog(false);
    }
  }, [recipeCatalog, showToast]);

  const loadRecipeLibraryDetails = useCallback(async () => {
    if (recipeLibraryDetails.length > 0) return recipeLibraryDetails;

    const recipes = await fetchFridgeRecipeLibrary(150);
    setRecipeLibraryDetails(recipes);
    return recipes;
  }, [recipeLibraryDetails]);

  const openRecipeDetail = useCallback(
    async (recipeId: number, date: string, fallback?: RecipeRecommendation) => {
      setDetailRecipeDate(date);
      setIsLoadingDetailRecipe(true);

      try {
        const recipes = await loadRecipeLibraryDetails();
        const recipe = recipes.find((item) => item.recipeId === recipeId);
        if (recipe) {
          setDetailRecipe({
            ...recipe,
            favorite: favoriteRecipeIds.has(recipe.recipeId),
          });
          return;
        }

        if (fallback) {
          setDetailRecipe(recommendationToDetailRecipe(fallback, favoriteRecipeIds.has(fallback.recipeId)));
          return;
        }

        showToast("Không tải được chi tiết món ăn này.", "error");
      } catch (error) {
        if (fallback) {
          setDetailRecipe(recommendationToDetailRecipe(fallback, favoriteRecipeIds.has(fallback.recipeId)));
        } else {
          showToast(getErrorMessage(error, "Không tải được chi tiết món ăn này."), "error");
        }
      } finally {
        setIsLoadingDetailRecipe(false);
      }
    },
    [favoriteRecipeIds, loadRecipeLibraryDetails, showToast]
  );

  const closeRecipeDetail = useCallback(() => {
    setDetailRecipe(null);
    setDetailRecipeDate(null);
  }, []);

  const handleToggleDetailFavorite = useCallback(
    async (recipe: RecipeFromApi) => {
      if (pendingFavoriteIds.has(recipe.recipeId)) return;

      setPendingFavoriteIds((current) => new Set(current).add(recipe.recipeId));
      const isFavorite = favoriteRecipeIds.has(recipe.recipeId);

      try {
        if (isFavorite) {
          await removeFavoriteRecipe(recipe.recipeId);
          setFavoriteRecipeIds((current) => {
            const next = new Set(current);
            next.delete(recipe.recipeId);
            return next;
          });
          setDetailRecipe((current) => (current?.recipeId === recipe.recipeId ? { ...current, favorite: false } : current));
          showToast("Đã bỏ món khỏi yêu thích.", "success");
        } else {
          await addFavoriteRecipe(recipe.recipeId);
          setFavoriteRecipeIds((current) => new Set(current).add(recipe.recipeId));
          setDetailRecipe((current) => (current?.recipeId === recipe.recipeId ? { ...current, favorite: true } : current));
          showToast("Đã thêm món vào yêu thích.", "success");
        }
      } catch (error) {
        showToast(getErrorMessage(error, "Không cập nhật được trạng thái yêu thích."), "error");
      } finally {
        setPendingFavoriteIds((current) => {
          const next = new Set(current);
          next.delete(recipe.recipeId);
          return next;
        });
      }
    },
    [favoriteRecipeIds, pendingFavoriteIds, showToast]
  );

  const handleAddMissingToShopping = useCallback(
    (recipe: RecipeFromApi, missing: RecipeIngredientFromApi[]) => {
      if (missing.length === 0) {
        showToast("Món này đã đủ nguyên liệu, không cần thêm.", "success");
        return;
      }

      // Đẩy nguyên liệu còn thiếu sang hàng chờ của trang Kế hoạch đi chợ.
      addPendingShoppingItems(
        missing.map((item) => ({
          foodId: item.foodId,
          foodName: item.foodName,
          unit: item.requiredUnit || "kg",
          quantity: item.requiredQuantity ?? 1,
          source: "MEAL_MISSING" as const,
          note: `Thiếu cho ${recipe.name}`,
        }))
      );

      showToast(`Đã thêm ${missing.length} nguyên liệu thiếu vào Kế hoạch đi chợ.`, "success");
      closeRecipeDetail();
    },
    [closeRecipeDetail, showToast]
  );

  const loadFamily = useCallback(async () => {
    const currentFamily = await recommendationApi.getCurrentFamily();
    if (!Number.isFinite(currentFamily.id)) {
      throw new Error("Current family id is missing");
    }
    setFamily(currentFamily);
    return currentFamily;
  }, []);

  const loadMenuPlan = useCallback(
    async (familyId: number, targetUserId: number, startDate: string) => {
      if (!Number.isFinite(familyId) || !Number.isFinite(targetUserId)) {
        setMenuDays([]);
        return [];
      }

      setIsLoadingPlan(true);
      try {
        const endDate = toDateOnly(addDays(parseDateOnly(startDate), 6));
        const response = await recommendationApi.getMenuPlan({ familyId, userId: targetUserId, startDate, endDate });
        setMenuDays(response.days);
        return response.days;
      } catch {
        showToast("Không tải được thực đơn đã lưu.", "error");
        setMenuDays([]);
        return [];
      } finally {
        setIsLoadingPlan(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!userId) return;

    loadFamily()
      .then(async (currentFamily) => {
        const currentWeekDays = await loadMenuPlan(currentFamily.id, userId, weekStartDate);
        if (hasSavedRecipes(currentWeekDays)) return;

        const nextWeekStart = toDateOnly(addDays(parseDateOnly(weekStartDate), 7));
        const nextWeekEnd = toDateOnly(addDays(parseDateOnly(nextWeekStart), 6));
        const nextWeekPlan = await recommendationApi
          .getMenuPlan({ familyId: currentFamily.id, userId, startDate: nextWeekStart, endDate: nextWeekEnd })
          .catch(() => null);

        if (nextWeekPlan?.days && hasSavedRecipes(nextWeekPlan.days)) {
          setWeekStartDate(nextWeekStart);
          setSelectedDate(nextWeekStart);
          setMenuDays(nextWeekPlan.days);
        }
      })
      .catch((error: unknown) => showToast(getErrorMessage(error, "Không xác định được gia đình hiện tại."), "error"));
  }, [loadFamily, loadMenuPlan, showToast, userId, weekStartDate]);

  const handleShiftWeek = (direction: -1 | 1) => {
    const nextStart = toDateOnly(addDays(parseDateOnly(weekStartDate), direction * 7));
    setWeekStartDate(nextStart);
    setSelectedDate(nextStart);
  };

  const loadDraftPlan = useCallback(
    async (startDate: string, mode: MenuGenerateMode) => {
      setDraftDays(createDraftDaysFromMenuPlan(startDate, mode, menuDays));

      if (!family?.id || !userId) return;

      setIsLoadingDraftPlan(true);
      try {
        const endDate = toDateOnly(addDays(parseDateOnly(startDate), mode === "WEEK" ? 6 : 0));
        const response = await recommendationApi.getMenuPlan({
          familyId: family.id,
          userId,
          startDate,
          endDate,
        });
        setDraftDays(createDraftDaysFromMenuPlan(startDate, mode, response.days));
      } catch (error) {
        showToast(getErrorMessage(error, "Không tải được thực đơn đã lưu cho khoảng ngày đã chọn."), "error");
      } finally {
        setIsLoadingDraftPlan(false);
      }
    },
    [family?.id, menuDays, showToast, userId]
  );

  const openCreateModal = (mode: MenuGenerateMode = "WEEK", startDate = selectedDate) => {
    setDraftMode(mode);
    setDraftStartDate(startDate);
    setDraftPickerTarget(null);
    setDraftRecipeSearch("");
    setIsModalOpen(true);
    void loadDraftPlan(startDate, mode);
  };

  const generateDraft = async () => {
    if (!family?.id || !userId) {
      showToast("Cần có gia đình và tài khoản đăng nhập để tạo thực đơn.", "error");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await recommendationApi.generateMenuDraft({
        familyId: family.id,
        userId,
        startDate: draftStartDate,
        mode: draftMode,
        candidateLimit: 12,
      });

      const generatedDraftDays = createDraftDaysFromGeneratedPlan(draftStartDate, draftMode, response.days);
      setDraftDays((currentDays) =>
        mergeGeneratedDraftWithSavedDraft(
          generatedDraftDays,
          currentDays.length > 0 ? currentDays : createDraftDaysFromMenuPlan(draftStartDate, draftMode, menuDays)
        )
      );
      if (generatedDraftDays.every((day) => day.meals.every((meal) => meal.slots.every((slot) => !slot.recommendation)))) {
        showToast("Không tìm thấy món phù hợp với nguyên liệu hiện có.", "error");
      }
    } catch (error) {
      showToast(getErrorMessage(error, "Tạo thực đơn tự động bị lỗi. Kiểm tra lại dữ liệu tủ lạnh và recipe."), "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const startBlankDraft = () => {
    setDraftDays(createDraftDaysFromMenuPlan(draftStartDate, draftMode, menuDays));
    setDraftPickerTarget(null);
  };

  const updateDraftMealSlot = (date: string, mealType: MealType, slotId: string, recommendation: RecipeRecommendation | null) => {
    setDraftDays((currentDays) => {
      const baseDays = currentDays.length > 0 ? currentDays : createDraftDaysFromMenuPlan(draftStartDate, draftMode, menuDays);

      return baseDays.map((day) => {
        if (day.date !== date) return day;
        return {
          ...day,
          meals: day.meals.map((meal) =>
            meal.mealType === mealType
              ? {
                  ...meal,
                  slots: meal.slots.map((slot) => (slot.id === slotId ? { ...slot, recommendation } : slot)),
                }
              : meal
          ),
        };
      });
    });
  };

  const addDraftMealSlot = (date: string, mealType: MealType) => {
    const slot = createDraftSlot(date, mealType, `custom-${Date.now()}`);
    setDraftDays((currentDays) => {
      const baseDays = currentDays.length > 0 ? currentDays : createDraftDaysFromMenuPlan(draftStartDate, draftMode, menuDays);

      return baseDays.map((day) => {
        if (day.date !== date) return day;
        return {
          ...day,
          meals: day.meals.map((meal) => (meal.mealType === mealType ? { ...meal, slots: [...meal.slots, slot] } : meal)),
        };
      });
    });
    void openDraftRecipePicker({ date, mealType, slotId: slot.id });
  };

  const removeDraftMealSlot = (date: string, mealType: MealType, slotId: string) => {
    setDraftDays((currentDays) => {
      const baseDays = currentDays.length > 0 ? currentDays : createDraftDaysFromMenuPlan(draftStartDate, draftMode, menuDays);

      return baseDays.map((day) => {
        if (day.date !== date) return day;
        return {
          ...day,
          meals: day.meals.map((meal) => {
            if (meal.mealType !== mealType) return meal;
            const targetSlot = meal.slots.find((slot) => slot.id === slotId);
            if (targetSlot?.existingMealItemId) {
              return {
                ...meal,
                slots: meal.slots.map((slot) => (slot.id === slotId ? { ...slot, recommendation: null } : slot)),
              };
            }
            const nextSlots = meal.slots.filter((slot) => slot.id !== slotId);
            return {
              ...meal,
              slots: nextSlots.length > 0 ? nextSlots : [createDraftSlot(date, mealType, "empty")],
            };
          }),
        };
      });
    });
  };

  const openDraftRecipePicker = async (target: DraftPickerTarget) => {
    setDraftPickerTarget(target);
    setDraftRecipeSearch("");
    void loadRecipeCatalog();

    if (!family?.id || !userId) {
      setDraftPickerOptions([]);
      return;
    }

    setIsLoadingDraftPickerOptions(true);
    try {
      const response = await recommendationApi.recommendRecipes({
        familyId: family.id,
        userId,
        mealType: target.mealType,
        date: target.date,
        limit: 12,
      });
      setDraftPickerOptions(response.recommendations);
    } catch {
      setDraftPickerOptions([]);
    } finally {
      setIsLoadingDraftPickerOptions(false);
    }
  };

  const selectDraftRecipe = (recipe: RecipeRecommendation) => {
    if (!draftPickerTarget) return;
    updateDraftMealSlot(draftPickerTarget.date, draftPickerTarget.mealType, draftPickerTarget.slotId, recipe);
    setDraftPickerTarget(null);
    setDraftRecipeSearch("");
  };

  const saveDraft = async () => {
    if (!family?.id || !userId) {
      showToast("Cần có gia đình và tài khoản đăng nhập để lưu thực đơn.", "error");
      return;
    }

    const changedMealSlots = draftDays.flatMap((day) =>
      day.meals.flatMap((meal) =>
        meal.slots
          .map((slot) => ({ date: day.date, mealType: meal.mealType, slot }))
          .filter(({ slot }) => {
            if (slot.existingMealItemId) {
              return !slot.recommendation || slot.recommendation.recipeId !== slot.originalRecipeId;
            }
            return Boolean(slot.recommendation);
          })
      )
    );

    const hasAnyRecipe = draftDays.some((day) => day.meals.some((meal) => meal.slots.some((slot) => slot.recommendation)));
    if (!hasAnyRecipe) {
      showToast("Chưa có món nào trong bản xem trước để lưu.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all(
        changedMealSlots.map(({ date, mealType, slot }) => {
          if (slot.existingMealItemId && !slot.recommendation) {
            return recommendationApi.deleteMealItem(slot.existingMealItemId, {
              familyId: family.id,
              userId,
            });
          }

          if (slot.existingMealItemId && slot.recommendation) {
            return recommendationApi.updateMealItem(slot.existingMealItemId, {
              familyId: family.id,
              userId,
              recipeId: slot.recommendation.recipeId,
              mealType,
              date,
              status: "CONFIRMED",
            });
          }

          return recommendationApi.addRecommendationToMeal(slot.recommendation?.recipeId as number, {
            familyId: family.id,
            mealType,
            date,
            status: "CONFIRMED",
          });
        })
      );

      const nextWeekStart = toDateOnly(getWeekStart(parseDateOnly(draftStartDate)));
      setWeekStartDate(nextWeekStart);
      setSelectedDate(draftStartDate);
      await loadMenuPlan(family.id, userId, nextWeekStart);
      setIsModalOpen(false);
      showToast("Đã lưu thực đơn vào kế hoạch bữa ăn.", "success");
    } catch {
      showToast("Không lưu được thực đơn. Vui lòng thử lại.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const loadEditOptions = useCallback(
    async (nextForm: EditMealForm, autoSelectFirst = false) => {
      if (!family?.id || !userId) return;

      setIsLoadingEditOptions(true);
      try {
        const response = await recommendationApi.recommendRecipes({
          familyId: family.id,
          userId,
          mealType: nextForm.mealType,
          date: nextForm.date,
          limit: 12,
        });
        setEditOptions(response.recommendations);
        if (autoSelectFirst) {
          const firstRecommendation = response.recommendations[0] ?? null;
          setEditForm((current) => {
            if (!current || current.mealItemId !== nextForm.mealItemId) {
              return current;
            }
            if (current.date !== nextForm.date || current.mealType !== nextForm.mealType) {
              return current;
            }
            return {
              ...current,
              selectedRecipeId: firstRecommendation?.recipeId ?? null,
              recipeName: firstRecommendation?.recipeName ?? "",
            };
          });
        }
      } catch (error) {
        setEditOptions([]);
        if (autoSelectFirst) {
          setEditForm((current) => {
            if (!current || current.mealItemId !== nextForm.mealItemId) {
              return current;
            }
            return {
              ...current,
              selectedRecipeId: null,
              recipeName: "",
            };
          });
        }
        showToast(getErrorMessage(error, "Không tải được danh sách món thay thế."), "error");
      } finally {
        setIsLoadingEditOptions(false);
      }
    },
    [family?.id, showToast, userId]
  );

  const openEditMealItem = (recipe: MenuPlanRecipe, mealType: MealType) => {
    const form: EditMealForm = {
      mealItemId: recipe.mealItemId,
      currentRecipeId: recipe.recipeId,
      selectedRecipeId: recipe.recipeId,
      mealType,
      date: selectedDate,
      originalMealType: mealType,
      originalDate: selectedDate,
      originalRecipeName: recipe.recipeName,
      status: (recipe.status === "SUGGESTED" ? "SUGGESTED" : "CONFIRMED"),
      recipeName: recipe.recipeName,
    };

    setEditForm(form);
    setEditOptions([]);
    void loadEditOptions(form);
  };

  const updateEditForm = (nextValues: Partial<EditMealForm>) => {
    setEditForm((current) => {
      if (!current) return current;
      if (nextValues.mealType || nextValues.date) {
        const nextForm = {
          ...current,
          ...nextValues,
          selectedRecipeId: null,
          recipeName: "",
        };
        setEditOptions([]);
        void loadEditOptions(nextForm, true);
        return nextForm;
      }
      const nextForm = { ...current, ...nextValues };
      return nextForm;
    });
  };

  const saveMealItemEdit = async () => {
    if (!family?.id || !userId || !editForm) {
      showToast("Không đủ dữ liệu để chỉnh sửa món trong bữa.", "error");
      return;
    }
    if (!editForm.selectedRecipeId) {
      showToast("Vui lòng chọn một món thay thế trước khi lưu.", "error");
      return;
    }

    setIsUpdatingMealItem(true);
    try {
      await recommendationApi.updateMealItem(editForm.mealItemId, {
        familyId: family.id,
        userId,
        recipeId: editForm.selectedRecipeId,
        mealType: editForm.mealType,
        date: editForm.date,
        status: editForm.status,
      });

      const nextWeekStart = toDateOnly(getWeekStart(parseDateOnly(editForm.date)));
      setWeekStartDate(nextWeekStart);
      setSelectedDate(editForm.date);
      await loadMenuPlan(family.id, userId, nextWeekStart);
      setEditForm(null);
      showToast("Đã cập nhật món trong thực đơn.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Không cập nhật được món trong thực đơn."), "error");
    } finally {
      setIsUpdatingMealItem(false);
    }
  };

  const deleteMealItem = async () => {
    if (!family?.id || !userId || !editForm) {
      showToast("Không đủ dữ liệu để xóa món khỏi bữa.", "error");
      return;
    }

    setIsUpdatingMealItem(true);
    try {
      await recommendationApi.deleteMealItem(editForm.mealItemId, {
        familyId: family.id,
        userId,
      });

      const nextWeekStart = toDateOnly(getWeekStart(parseDateOnly(editForm.date)));
      setWeekStartDate(nextWeekStart);
      setSelectedDate(editForm.date);
      await loadMenuPlan(family.id, userId, nextWeekStart);
      setEditForm(null);
      showToast("Đã xóa món khỏi bữa ăn.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Không xóa được món khỏi bữa ăn."), "error");
    } finally {
      setIsUpdatingMealItem(false);
    }
  };

  return (
    <div className="menu-suggestion-layout">
      <Sidebar />

      <div className="menu-suggestion-page">
        <Topbar title="Danh sách thực đơn" searchPlaceholder="Tìm kiếm theo ngày" showSearch={false} />

        <main className="menu-suggestion">
          <section className="menu-calendar-strip" aria-label="Chọn ngày trong tuần">
            <button className="calendar-nav-btn" type="button" onClick={() => handleShiftWeek(-1)} aria-label="Tuần trước">
              <ChevronLeft size={20} />
            </button>

            <div className="menu-week-days">
              {weekDays.map((day) => {
                const dateString = toDateOnly(day);
                return (
                  <button
                    className={`menu-day-pill ${selectedDate === dateString ? "active" : ""}`}
                    key={dateString}
                    type="button"
                    onClick={() => setSelectedDate(dateString)}
                  >
                    <span>{weekdayShort[day.getDay()]}</span>
                    <strong>{day.getDate()}</strong>
                  </button>
                );
              })}
            </div>

            <button className="calendar-nav-btn" type="button" onClick={() => handleShiftWeek(1)} aria-label="Tuần sau">
              <ChevronRight size={20} />
            </button>
          </section>

          <section className="menu-page-grid">
            <div className="meal-sections">
              {isLoadingPlan ? (
                <div className="meal-empty-state">
                  <Loader2 className="menu-spin" size={24} />
                  <span>Đang tải thực đơn trong tuần...</span>
                </div>
              ) : (
                mealTypes.map((mealType) => {
                  const meal = getMealFromDay(selectedMenuDay, mealType);
                  const meta = mealMeta[mealType];

                  return (
                    <section className="meal-section" key={mealType}>
                      <header className="meal-section-header">
                        <div className="meal-title">
                          <span style={{ color: mealType === "DINNER" ? "#79401d" : "#006b55" }}>{meta.icon}</span>
                          <h2>{meta.label}</h2>
                          <span className="meal-time">{meta.time}</span>
                        </div>

                        <button className="meal-add-btn" type="button" onClick={() => openCreateModal("DAY", selectedDate)}>
                          <Plus size={16} />
                          Thêm món
                        </button>
                      </header>

                      {meal.recipes.length > 0 ? (
                        <div className="recipe-card-grid">
                          {meal.recipes.map((recipe) => (
                            <article
                              className="menu-recipe-card"
                              key={recipe.mealItemId}
                              onClick={() => openRecipeDetail(recipe.recipeId, selectedDate, menuPlanRecipeToRecommendation(recipe))}
                              tabIndex={0}
                              role="button"
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  void openRecipeDetail(recipe.recipeId, selectedDate, menuPlanRecipeToRecommendation(recipe));
                                }
                              }}
                            >
                              <div className="menu-recipe-image">
                                {recipe.imageUrl ? <img src={recipe.imageUrl} alt={recipe.recipeName} /> : getRecipeInitial(recipe.recipeName)}
                              </div>
                              <h3>{recipe.recipeName}</h3>
                              <p>Đã được thêm vào {meta.label.toLowerCase()} ngày {formatDisplayDate(selectedDate)}.</p>
                              <button
                                className="recipe-edit-btn"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditMealItem(recipe, mealType);
                                }}
                              >
                                <Edit3 size={14} />
                                Chỉnh sửa
                              </button>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="meal-empty-state">
                          <Utensils size={24} />
                          <strong>Chưa có món cho {meta.label.toLowerCase()}</strong>
                          <span>Dùng tạo tự động để lấy món phù hợp với tủ lạnh gia đình.</span>
                        </div>
                      )}
                    </section>
                  );
                })
              )}
            </div>

            <aside className="menu-side-panel">
              <section className="menu-side-card">
                <h2>{family?.name || "Gia đình"}</h2>
                <p>
                  Thực đơn ngày {formatDisplayDate(selectedDate)} được người dùng tự động chỉnh sửa. Tạo tự động sẽ gọi thuật toán
                  gợi ý cho từng slot bữa ăn.
                </p>
                <div className="menu-side-stat">
                  <div>
                    <strong>{selectedRecipeCount}</strong>
                    <span>món trong ngày</span>
                  </div>
                  <div>
                    <strong>{weekRecipeCount}</strong>
                    <span>món trong tuần</span>
                  </div>
                </div>
              </section>

              <section className="menu-side-card">
                <h3>Tạo thực đơn tự động</h3>
                <p>Hệ thống ưu tiên nguyên liệu có trong tủ, hạn sử dụng, bữa ăn, món yêu thích và tránh lặp món gần đây.</p>
                <button className="menu-primary-btn" type="button" onClick={() => openCreateModal("WEEK", selectedDate)}>
                  <Sparkles size={18} />
                  Tạo thực đơn tự động
                </button>
              </section>
            </aside>
          </section>
        </main>
      </div>

      {isModalOpen && (
        <div className="menu-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <section className="menu-modal" onClick={(event) => event.stopPropagation()}>
            <header className="menu-modal-header">
              <div>
                <h2>Tạo thực đơn mới</h2>
                <p>Chọn ngày bắt đầu, tạo khung gợi ý và tùy chỉnh từng món trước khi lưu.</p>
              </div>
              <button className="menu-icon-btn" type="button" onClick={() => setIsModalOpen(false)} aria-label="Đóng">
                <X size={18} />
              </button>
            </header>

            <div className="menu-modal-body">
              <div className="menu-modal-controls">
                <div className="menu-field">
                  <label htmlFor="menu-start-date">Chọn ngày bắt đầu</label>
                  <input
                    id="menu-start-date"
                    type="date"
                    value={draftStartDate}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraftStartDate(value);
                      setDraftPickerTarget(null);
                      void loadDraftPlan(value, draftMode);
                    }}
                  />
                </div>

                <div className="menu-field">
                  <label>Loại thực đơn</label>
                  <div className="menu-segmented">
                    <button
                      className={draftMode === "DAY" ? "active" : ""}
                      type="button"
                      onClick={() => {
                        setDraftMode("DAY");
                        setDraftPickerTarget(null);
                        void loadDraftPlan(draftStartDate, "DAY");
                      }}
                    >
                      Theo ngày
                    </button>
                    <button
                      className={draftMode === "WEEK" ? "active" : ""}
                      type="button"
                      onClick={() => {
                        setDraftMode("WEEK");
                        setDraftPickerTarget(null);
                        void loadDraftPlan(draftStartDate, "WEEK");
                      }}
                    >
                      Theo tuần
                    </button>
                  </div>
                </div>

                <button className="menu-primary-btn" type="button" onClick={generateDraft} disabled={isGenerating}>
                  {isGenerating ? <Loader2 size={18} /> : <Sparkles size={18} />}
                  {isGenerating ? "Đang tạo..." : "Tạo thực đơn tự động"}
                </button>
              </div>

              <section className="menu-preview-panel">
                <header className="menu-preview-header">
                  <h3>Xem trước thực đơn</h3>
                  <span className="menu-score-chip">
                    <Info size={13} /> Dựa trên khẩu vị và tủ lạnh gia đình
                  </span>
                </header>

                {isLoadingDraftPlan ? (
                  <div className="menu-modal-empty">
                    <Loader2 className="menu-spin" size={22} />
                    <span>Đang đồng bộ thực đơn đã lưu cho khoảng ngày này...</span>
                  </div>
                ) : draftDays.length === 0 ? (
                  <div className="menu-modal-empty">
                    <span>Nhấn “Tạo thực đơn tự động” để lấy gợi ý hoặc tạo khung trống để tự chọn món.</span>
                    <button className="menu-secondary-btn" type="button" onClick={startBlankDraft}>
                      <Plus size={17} />
                      Tự chọn món ăn
                    </button>
                  </div>
                ) : (
                  <div className="menu-preview-list">
                    {draftDays.map((day, index) => {
                      const date = parseDateOnly(day.date);
                      return (
                        <article className="menu-preview-day" key={day.date}>
                          <div className="menu-preview-day-head">
                            <span>Ngày {index + 1}: {formatDisplayDate(day.date)}</span>
                            <span>{weekdayLong[date.getDay()]}</span>
                          </div>

                          {day.meals.map((meal) => {
                            const meta = mealMeta[meal.mealType];
                            return (
                              <div className="menu-preview-meal" key={`${day.date}-${meal.mealType}`}>
                                <div className="menu-preview-meal-label">
                                  <span style={{ backgroundColor: meta.accent }} className="menu-icon-btn">
                                    {meta.icon}
                                  </span>
                                  {meta.label}
                                </div>

                                <div className="menu-preview-slots">
                                  {meal.slots.map((slot) => (
                                    <div className="menu-preview-slot" key={slot.id}>
                                      {slot.recommendation ? (
                                        <button
                                          className="menu-preview-recipe menu-preview-recipe-button"
                                          type="button"
                                          onClick={() => openRecipeDetail(slot.recommendation!.recipeId, day.date, slot.recommendation!)}
                                        >
                                            <strong>{slot.recommendation.recipeName}</strong>
                                            {slot.recommendation.score > 0 ? (
                                              <span>
                                                Khớp {slot.recommendation.matchPercent}% nguyên liệu · Thiếu{" "}
                                                {slot.recommendation.missingIngredients.length} nguyên liệu
                                              </span>
                                            ) : (
                                              <span>{slot.existingMealItemId ? "Đã có trong thực đơn đã lưu." : "Món người dùng tự chọn."}</span>
                                            )}
                                        </button>
                                      ) : (
                                        <div className="menu-preview-recipe">
                                          <span>Không có món phù hợp với slot này.</span>
                                        </div>
                                      )}

                                      <div className="menu-preview-actions">
                                        {slot.recommendation ? (
                                          <>
                                            <button
                                              className="menu-tiny-icon-btn"
                                              type="button"
                                              onClick={() => openDraftRecipePicker({ date: day.date, mealType: meal.mealType, slotId: slot.id })}
                                              aria-label={`Thay món ${meta.label.toLowerCase()}`}
                                            >
                                              <Edit3 size={14} />
                                            </button>
                                            <button
                                              className="menu-tiny-icon-btn danger"
                                              type="button"
                                              onClick={() => removeDraftMealSlot(day.date, meal.mealType, slot.id)}
                                              aria-label={`Xóa món ${meta.label.toLowerCase()}`}
                                            >
                                              <X size={14} />
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            className="menu-tiny-add-btn"
                                            type="button"
                                            onClick={() => openDraftRecipePicker({ date: day.date, mealType: meal.mealType, slotId: slot.id })}
                                          >
                                            <Plus size={15} />
                                            Chọn món
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  className="menu-tiny-icon-btn add-slot"
                                  type="button"
                                  onClick={() => addDraftMealSlot(day.date, meal.mealType)}
                                  aria-label={`Thêm món cho ${meta.label.toLowerCase()}`}
                                >
                                  <Plus size={15} />
                                </button>
                              </div>
                            );
                          })}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <footer className="menu-modal-footer">
              <button className="menu-secondary-btn" type="button" onClick={() => setIsModalOpen(false)}>
                Hủy
              </button>
              <button className="menu-primary-btn" type="button" onClick={saveDraft} disabled={isSaving || draftDays.length === 0}>
                {isSaving ? <Loader2 size={18} /> : <CalendarDays size={18} />}
                {isSaving ? "Đang lưu..." : "Lưu thực đơn"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {draftPickerTarget && (
        <div className="menu-modal-backdrop nested" onClick={() => setDraftPickerTarget(null)}>
          <section className="menu-modal menu-picker-modal" onClick={(event) => event.stopPropagation()}>
            <header className="menu-modal-header">
              <div>
                <h2>Chọn món ăn</h2>
                <p>
                  {mealMeta[draftPickerTarget.mealType].label} ngày {formatDisplayDate(draftPickerTarget.date)}
                </p>
              </div>
              <button className="menu-icon-btn" type="button" onClick={() => setDraftPickerTarget(null)} aria-label="Đóng">
                <X size={18} />
              </button>
            </header>

            <div className="menu-modal-body">
              <div className="menu-field">
                <label htmlFor="draft-recipe-search">Tìm món</label>
                <input
                  id="draft-recipe-search"
                  type="search"
                  value={draftRecipeSearch}
                  onChange={(event) => setDraftRecipeSearch(event.target.value)}
                  placeholder="Nhập tên món ăn"
                />
              </div>

              <section className="menu-preview-panel">
                <header className="menu-preview-header">
                  <h3>Món gợi ý phù hợp</h3>
                  <span className="menu-score-chip">
                    <Info size={13} /> Có thể bỏ qua và chọn món bất kỳ bên dưới
                  </span>
                </header>

                {isLoadingDraftPickerOptions ? (
                  <div className="menu-modal-empty compact">
                    <Loader2 className="menu-spin" size={20} />
                    <span>Đang tải món gợi ý...</span>
                  </div>
                ) : draftPickerOptions.length > 0 ? (
                  <div className="draft-picker-grid">
                    {draftPickerOptions.map((recipe) => (
                      <button className="draft-picker-option" key={recipe.recipeId} type="button" onClick={() => selectDraftRecipe(recipe)}>
                        <strong>{recipe.recipeName}</strong>
                        <span>
                          Khớp {recipe.matchPercent}% · Thiếu {recipe.missingIngredients.length} nguyên liệu
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="menu-modal-empty compact">
                    <span>Không có món gợi ý cho slot này.</span>
                  </div>
                )}
              </section>

              <section className="menu-preview-panel">
                <header className="menu-preview-header">
                  <h3>Tất cả món ăn</h3>
                  <span className="menu-score-chip">{recipeCatalog.length} món</span>
                </header>

                {isLoadingRecipeCatalog ? (
                  <div className="menu-modal-empty compact">
                    <Loader2 className="menu-spin" size={20} />
                    <span>Đang tải danh sách món...</span>
                  </div>
                ) : (
                  <div className="draft-picker-grid">
                    {recipeCatalog
                      .filter((recipe) => recipe.name.toLowerCase().includes(draftRecipeSearch.trim().toLowerCase()))
                      .map((recipe) => (
                        <button
                          className="draft-picker-option"
                          key={recipe.id}
                          type="button"
                          onClick={() => selectDraftRecipe(catalogRecipeToRecommendation(recipe))}
                        >
                          <strong>{recipe.name}</strong>
                          <span>{getMealDisplayLabel(recipe.preferredMealTime || recipe.displayStatus)}</span>
                        </button>
                      ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      )}

      {editForm && (
        <div className="menu-modal-backdrop" onClick={() => setEditForm(null)}>
          <section className="menu-modal menu-edit-modal" onClick={(event) => event.stopPropagation()}>
            <header className="menu-modal-header">
              <div>
                <h2>Chỉnh sửa món trong bữa</h2>
                <p>Đổi ngày, bữa ăn, trạng thái hoặc thay bằng món recommendation khác.</p>
              </div>
              <button className="menu-icon-btn" type="button" onClick={() => setEditForm(null)} aria-label="Đóng">
                <X size={18} />
              </button>
            </header>

            <div className="menu-modal-body">
              <div className="menu-modal-controls edit-controls">
                <div className="menu-field">
                  <label htmlFor="edit-meal-date">Ngày ăn</label>
                  <input
                    id="edit-meal-date"
                    type="date"
                    value={editForm.date}
                    onChange={(event) => updateEditForm({ date: event.target.value })}
                  />
                </div>

                <div className="menu-field">
                  <label htmlFor="edit-meal-type">Bữa ăn</label>
                  <select
                    id="edit-meal-type"
                    value={editForm.mealType}
                    onChange={(event) => updateEditForm({ mealType: event.target.value as MealType })}
                  >
                    {mealTypes.map((mealType) => (
                      <option key={mealType} value={mealType}>
                        {mealMeta[mealType].label}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <section className="menu-preview-panel">
                <header className="menu-preview-header">
                  <h3>Món thay thế</h3>
                  <span className="menu-score-chip">
                    <Info size={13} />{" "}
                    {isLoadingEditOptions
                      ? "Đang tải món phù hợp..."
                      : editForm.recipeName
                        ? `Đang chọn: ${editForm.recipeName}`
                        : "Chưa có món phù hợp để chọn"}
                  </span>
                </header>

                <div className="edit-recipe-options">
                  {editForm.date === editForm.originalDate && editForm.mealType === editForm.originalMealType && (
                    <button
                      className={`edit-recipe-option ${editForm.selectedRecipeId === editForm.currentRecipeId ? "selected" : ""}`}
                      type="button"
                      onClick={() =>
                        updateEditForm({
                          selectedRecipeId: editForm.currentRecipeId,
                          recipeName: editForm.originalRecipeName,
                        })
                      }
                    >
                      <strong>{editForm.originalRecipeName}</strong>
                      <span>Giữ món hiện tại</span>
                    </button>
                  )}

                  {isLoadingEditOptions ? (
                    <div className="menu-modal-empty compact">
                      <Loader2 className="menu-spin" size={20} />
                      <span>Đang tải món gợi ý...</span>
                    </div>
                  ) : (
                    editOptions.map((recipe) => (
                      <button
                        className={`edit-recipe-option ${editForm.selectedRecipeId === recipe.recipeId ? "selected" : ""}`}
                        key={recipe.recipeId}
                        type="button"
                        onClick={() =>
                          updateEditForm({
                            selectedRecipeId: recipe.recipeId,
                            recipeName: recipe.recipeName,
                          })
                        }
                      >
                        <strong>{recipe.recipeName}</strong>
                        <span>
                          Khớp {recipe.matchPercent}% · Thiếu {recipe.missingIngredients.length} nguyên liệu
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </div>

            <footer className="menu-modal-footer">
              <button className="menu-danger-btn" type="button" onClick={deleteMealItem} disabled={isUpdatingMealItem}>
                <Trash2 size={17} />
                Xóa khỏi bữa
              </button>
              <div className="menu-modal-actions">
                <button className="menu-secondary-btn" type="button" onClick={() => setEditForm(null)}>
                  Hủy
                </button>
                <button className="menu-primary-btn" type="button" onClick={saveMealItemEdit} disabled={isUpdatingMealItem}>
                  {isUpdatingMealItem ? <Loader2 size={18} /> : <Check size={18} />}
                  {isUpdatingMealItem ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {detailRecipe && (
        <RecipeDetailPopup
          recipe={detailRecipe}
          isFavorite={favoriteRecipeIds.has(detailRecipe.recipeId)}
          isFavoritePending={pendingFavoriteIds.has(detailRecipe.recipeId)}
          onClose={closeRecipeDetail}
          onToggleFavorite={handleToggleDetailFavorite}
          onAddMissingToShopping={handleAddMissingToShopping}
        />
      )}

      {isLoadingDetailRecipe && (
        <div className="menu-detail-loading" role="status" aria-live="polite">
          <Loader2 className="menu-spin" size={18} />
          Đang tải chi tiết món ăn...
        </div>
      )}

      {toast && <div className={`menu-toast ${toast.variant}`}>{toast.message}</div>}
    </div>
  );
};

export default MenuSuggestion;
