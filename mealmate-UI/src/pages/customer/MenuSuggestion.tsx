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

type ToastState = {
  message: string;
  variant: "success" | "error";
};

type DraftMeal = {
  mealType: MealType;
  recommendation: RecipeRecommendation | null;
  existingMealItemId?: number;
  originalRecipeId?: number;
};

type DraftDay = {
  date: string;
  meals: DraftMeal[];
};

type EditMealForm = {
  mealItemId: number;
  currentRecipeId: number;
  selectedRecipeId: number;
  mealType: MealType;
  date: string;
  status: "SUGGESTED" | "CONFIRMED";
  recipeName: string;
};

type DraftPickerTarget = {
  date: string;
  mealType: MealType;
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

const createEmptyDraftDays = (startDate: string, mode: MenuGenerateMode): DraftDay[] => {
  const totalDays = mode === "WEEK" ? 7 : 1;
  const start = parseDateOnly(startDate);

  return Array.from({ length: totalDays }, (_, dayIndex) => ({
    date: toDateOnly(addDays(start, dayIndex)),
    meals: mealTypes.map((mealType) => ({
      mealType,
      recommendation: null,
    })),
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
        const savedRecipe = getMealFromDay(savedDay, draftMeal.mealType).recipes[0];
        if (!savedRecipe) return draftMeal;

        return {
          ...draftMeal,
          recommendation: menuPlanRecipeToRecommendation(savedRecipe),
          existingMealItemId: savedRecipe.mealItemId,
          originalRecipeId: savedRecipe.recipeId,
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

        return {
          ...generatedMeal,
          recommendation: generatedMeal.recommendation || savedMeal.recommendation,
          existingMealItemId: savedMeal.existingMealItemId,
          originalRecipeId: savedMeal.originalRecipeId,
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
        return;
      }

      setIsLoadingPlan(true);
      try {
        const endDate = toDateOnly(addDays(parseDateOnly(startDate), 6));
        const response = await recommendationApi.getMenuPlan({ familyId, userId: targetUserId, startDate, endDate });
        setMenuDays(response.days);
      } catch {
        showToast("Không tải được thực đơn đã lưu.", "error");
        setMenuDays([]);
      } finally {
        setIsLoadingPlan(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!userId) return;

    loadFamily()
      .then((currentFamily) =>
        loadMenuPlan(currentFamily.id, userId, weekStartDate).catch((error: unknown) =>
          showToast(getErrorMessage(error, "Không tải được thực đơn đã lưu."), "error")
        )
      )
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

      setDraftDays((currentDays) =>
        mergeGeneratedDraftWithSavedDraft(
          response.days,
          currentDays.length > 0 ? currentDays : createDraftDaysFromMenuPlan(draftStartDate, draftMode, menuDays)
        )
      );
      if (response.days.every((day) => day.meals.every((meal) => !meal.recommendation))) {
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

  const updateDraftMeal = (date: string, mealType: MealType, recommendation: RecipeRecommendation | null) => {
    setDraftDays((currentDays) => {
      const baseDays = currentDays.length > 0 ? currentDays : createDraftDaysFromMenuPlan(draftStartDate, draftMode, menuDays);

      return baseDays.map((day) => {
        if (day.date !== date) return day;
        return {
          ...day,
          meals: day.meals.map((meal) => (meal.mealType === mealType ? { ...meal, recommendation } : meal)),
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
    updateDraftMeal(draftPickerTarget.date, draftPickerTarget.mealType, recipe);
    setDraftPickerTarget(null);
    setDraftRecipeSearch("");
  };

  const saveDraft = async () => {
    if (!family?.id || !userId) {
      showToast("Cần có gia đình và tài khoản đăng nhập để lưu thực đơn.", "error");
      return;
    }

    const changedMeals = draftDays.flatMap((day) =>
      day.meals
        .map((meal) => ({ date: day.date, meal }))
        .filter(({ meal }) => {
          if (meal.existingMealItemId) {
            return !meal.recommendation || meal.recommendation.recipeId !== meal.originalRecipeId;
          }
          return Boolean(meal.recommendation);
        })
    );

    const hasAnyRecipe = draftDays.some((day) => day.meals.some((meal) => meal.recommendation));
    if (!hasAnyRecipe) {
      showToast("Chưa có món nào trong bản xem trước để lưu.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all(
        changedMeals.map(({ date, meal }) => {
          if (meal.existingMealItemId && !meal.recommendation) {
            return recommendationApi.deleteMealItem(meal.existingMealItemId, {
              familyId: family.id,
              userId,
            });
          }

          if (meal.existingMealItemId && meal.recommendation) {
            return recommendationApi.updateMealItem(meal.existingMealItemId, {
              familyId: family.id,
              userId,
              recipeId: meal.recommendation.recipeId,
              mealType: meal.mealType,
              date,
              status: "CONFIRMED",
            });
          }

          return recommendationApi.addRecommendationToMeal(meal.recommendation?.recipeId as number, {
            familyId: family.id,
            mealType: meal.mealType,
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
    async (nextForm: EditMealForm) => {
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
      } catch (error) {
        setEditOptions([]);
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
      const nextForm = { ...current, ...nextValues };
      if (nextValues.mealType || nextValues.date) {
        setEditOptions([]);
        void loadEditOptions(nextForm);
      }
      return nextForm;
    });
  };

  const saveMealItemEdit = async () => {
    if (!family?.id || !userId || !editForm) {
      showToast("Không đủ dữ liệu để chỉnh sửa món trong bữa.", "error");
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
                            <article className="menu-recipe-card" key={recipe.mealItemId}>
                              <div className="menu-recipe-image">
                                {recipe.imageUrl ? <img src={recipe.imageUrl} alt={recipe.recipeName} /> : getRecipeInitial(recipe.recipeName)}
                              </div>
                              <div className="recipe-status-row">
                                <span className="recipe-status-pill">{recipe.status || "CONFIRMED"}</span>
                                <Check size={16} color="#006b55" />
                              </div>
                              <h3>{recipe.recipeName}</h3>
                              <p>Đã được thêm vào {meta.label.toLowerCase()} ngày {formatDisplayDate(selectedDate)}.</p>
                              <button className="recipe-edit-btn" type="button" onClick={() => openEditMealItem(recipe, mealType)}>
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
                  Thực đơn ngày {formatDisplayDate(selectedDate)} được đọc từ meal plan đã lưu. Tạo tự động sẽ gọi thuật toán
                  recommendation cho từng slot bữa ăn.
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
                  Tạo thực đơn tuần
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

                                <div className="menu-preview-recipe">
                                  {meal.recommendation ? (
                                    <>
                                      <strong>{meal.recommendation.recipeName}</strong>
                                      {meal.recommendation.score > 0 ? (
                                        <span>
                                          Khớp {meal.recommendation.matchPercent}% nguyên liệu · Thiếu{" "}
                                          {meal.recommendation.missingIngredients.length} nguyên liệu
                                        </span>
                                      ) : (
                                        <span>{meal.existingMealItemId ? "Đã có trong thực đơn đã lưu." : "Món người dùng tự chọn."}</span>
                                      )}
                                    </>
                                  ) : (
                                    <span>Không có món phù hợp với slot này.</span>
                                  )}
                                </div>

                                <div className="menu-preview-actions">
                                  {meal.recommendation ? (
                                    <>
                                      <span className="menu-score-chip">
                                        {meal.existingMealItemId
                                          ? "Đã lưu"
                                          : meal.recommendation.score > 0
                                            ? `Score ${meal.recommendation.score}`
                                            : "Tự chọn"}
                                      </span>
                                      <button
                                        className="menu-tiny-icon-btn"
                                        type="button"
                                        onClick={() => openDraftRecipePicker({ date: day.date, mealType: meal.mealType })}
                                        aria-label={`Thay món ${meta.label.toLowerCase()}`}
                                      >
                                        <Edit3 size={14} />
                                      </button>
                                      <button
                                        className="menu-tiny-icon-btn danger"
                                        type="button"
                                        onClick={() => updateDraftMeal(day.date, meal.mealType, null)}
                                        aria-label={`Xóa món ${meta.label.toLowerCase()}`}
                                      >
                                        <X size={14} />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      className="menu-tiny-add-btn"
                                      type="button"
                                      onClick={() => openDraftRecipePicker({ date: day.date, mealType: meal.mealType })}
                                    >
                                      <Plus size={15} />
                                      Chọn món
                                    </button>
                                  )}
                                </div>
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
                          Score {recipe.score} · Khớp {recipe.matchPercent}% · Thiếu {recipe.missingIngredients.length} nguyên liệu
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
                          <span>{recipe.preferredMealTime || recipe.displayStatus || "Món tự chọn"}</span>
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

                <div className="menu-field">
                  <label htmlFor="edit-meal-status">Trạng thái</label>
                  <select
                    id="edit-meal-status"
                    value={editForm.status}
                    onChange={(event) => updateEditForm({ status: event.target.value as EditMealForm["status"] })}
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="SUGGESTED">SUGGESTED</option>
                  </select>
                </div>
              </div>

              <section className="menu-preview-panel">
                <header className="menu-preview-header">
                  <h3>Món thay thế</h3>
                  <span className="menu-score-chip">
                    <Info size={13} /> Đang chọn: {editForm.recipeName}
                  </span>
                </header>

                <div className="edit-recipe-options">
                  <button
                    className={`edit-recipe-option ${editForm.selectedRecipeId === editForm.currentRecipeId ? "selected" : ""}`}
                    type="button"
                    onClick={() => updateEditForm({ selectedRecipeId: editForm.currentRecipeId })}
                  >
                    <strong>{editForm.recipeName}</strong>
                    <span>Giữ món hiện tại</span>
                  </button>

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
                          Score {recipe.score} · Khớp {recipe.matchPercent}% · Thiếu {recipe.missingIngredients.length} nguyên liệu
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

      {toast && <div className={`menu-toast ${toast.variant}`}>{toast.message}</div>}
    </div>
  );
};

export default MenuSuggestion;
