import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Loader2, Sparkles, Users, Utensils } from "lucide-react";
import "./KitchenAssistant.css";

import RecipeDetailPopup from "./RecipeDetailPopup";
import {
  addFavoriteRecipe,
  fetchFavoriteRecipeIds,
  fetchRecipeSuggestions,
  removeFavoriteRecipe,
} from "./recipeApi";
import {
  coverageTone,
  difficultyClass,
  difficultyLabel,
  mealTimeLabel,
  recipeEmoji,
  type RecipeFromApi,
  type RecipeIngredientFromApi,
} from "./recipeTypes";
import { addPendingShoppingItems } from "@/features/shopping-plan/shoppingSuggestions";

type KitchenAssistantScreenProps = {
  /** Quay lại danh sách tủ lạnh. */
  onBackToFridge: () => void;
  /** Chuyển sang trang Gợi ý món ăn (thiết kế lưới cũ). */
  onViewAll: () => void;
};

type RankedRecipe = RecipeFromApi & { rank: number };

type ToastState = { message: string; variant: "success" | "info" };

const difficultyRank = (difficulty?: string) => {
  if (difficulty === "EASY") return 0;
  if (difficulty === "MEDIUM") return 1;
  if (difficulty === "HARD") return 2;
  return 3;
};

type ChatLine = { icon: string; text: string };

// Build các dòng tin nhắn của Trợ lý nhà bếp — ngắn gọn, dễ thương, có icon đầu dòng.
const buildAssistantMessages = (recipe: RankedRecipe): ChatLine[] => {
  const lines: ChatLine[] = [];

  if (recipe.expiringIngredients.length > 0) {
    const names = recipe.expiringIngredients
      .map((item) => item.foodName)
      .slice(0, 3)
      .join(", ");
    lines.push({ icon: "🔥", text: `Ưu tiên dùng ${names} vì sắp hết hạn rồi nè.` });
  }

  if (recipe.canCook || recipe.missingIngredients.length === 0) {
    lines.push({ icon: "✅", text: "Tủ lạnh đủ nguyên liệu, bạn có thể nấu ngay." });
  } else {
    lines.push({ icon: "🛒", text: `Chỉ thiếu ${recipe.missingIngredients.length} món, thêm vào kế hoạch đi chợ là xong.` });
  }

  if (recipe.coveragePercent >= 90) {
    lines.push({ icon: "✨", text: `Khớp ${recipe.coveragePercent}% đồ trong tủ, rất hợp để nấu hôm nay.` });
  } else {
    lines.push({ icon: "📌", text: `Khớp ${recipe.coveragePercent}% nguyên liệu bạn đang có.` });
  }

  if (recipe.servings) {
    lines.push({ icon: "🍽️", text: `Khẩu phần khoảng ${recipe.servings} người, vừa gọn cho bữa nhà mình.` });
  }

  return lines;
};

const ChefFridgeMascot: React.FC = () => (
  <div className="ka-mascot" aria-hidden="true">
    <svg viewBox="0 0 120 140" width="100%" height="100%">
      {/* chef hat */}
      <g className="ka-mascot-hat">
        <ellipse cx="60" cy="20" rx="26" ry="16" fill="#ffffff" stroke="#cfe7df" strokeWidth="2" />
        <circle cx="42" cy="22" r="11" fill="#ffffff" stroke="#cfe7df" strokeWidth="2" />
        <circle cx="78" cy="22" r="11" fill="#ffffff" stroke="#cfe7df" strokeWidth="2" />
        <rect x="40" y="28" width="40" height="12" rx="5" fill="#f3faf7" stroke="#cfe7df" strokeWidth="2" />
      </g>
      {/* fridge body */}
      <rect x="30" y="40" width="60" height="86" rx="16" fill="#eafaf4" stroke="#44BD97" strokeWidth="3" />
      <line x1="30" y1="74" x2="90" y2="74" stroke="#44BD97" strokeWidth="2.5" />
      <rect x="78" y="50" width="5" height="16" rx="2.5" fill="#44BD97" />
      <rect x="78" y="82" width="5" height="16" rx="2.5" fill="#44BD97" />
      {/* face */}
      <circle cx="48" cy="60" r="4" fill="#22413a" />
      <circle cx="72" cy="60" r="4" fill="#22413a" />
      <circle cx="49.5" cy="58.5" r="1.3" fill="#fff" />
      <circle cx="73.5" cy="58.5" r="1.3" fill="#fff" />
      <path d="M50 66 Q60 73 70 66" fill="none" stroke="#22413a" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="41" cy="66" r="3.5" fill="#ffc7b0" opacity="0.75" />
      <circle cx="79" cy="66" r="3.5" fill="#ffc7b0" opacity="0.75" />
    </svg>
  </div>
);

// Khung "ảnh phim" dán trên tờ note.
const FilmPhoto: React.FC<{ recipe: RecipeFromApi; size: "lg" | "sm" }> = ({ recipe, size }) => {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(recipe.imageUrl) && !failed;

  return (
    <div className={`ka-film ka-film-${size}`}>
      <span className="ka-film-hole ka-film-hole-1" />
      <span className="ka-film-hole ka-film-hole-2" />
      <span className="ka-film-hole ka-film-hole-3" />
      <div className="ka-film-window">
        {showImage ? (
          <img src={recipe.imageUrl} alt={recipe.name} onError={() => setFailed(true)} />
        ) : (
          <span className="ka-film-emoji">{recipeEmoji(recipe.name)}</span>
        )}
      </div>
      <span className="ka-film-caption">Fiza · {mealTimeLabel(recipe.preferredMealTime)}</span>
    </div>
  );
};

const KitchenAssistantScreen: React.FC<KitchenAssistantScreenProps> = ({ onBackToFridge, onViewAll }) => {
  const [recipes, setRecipes] = useState<RankedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeFromApi | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<ToastState | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [data, favorites] = await Promise.all([
        fetchRecipeSuggestions(30),
        fetchFavoriteRecipeIds().catch(() => [] as number[]),
      ]);

      const sorted = [...data].sort((a, b) => {
        if (b.coveragePercent !== a.coveragePercent) return b.coveragePercent - a.coveragePercent;
        const aExpiring = a.expiringIngredients.length;
        const bExpiring = b.expiringIngredients.length;
        if (bExpiring !== aExpiring) return bExpiring - aExpiring;
        const difficultyDiff = difficultyRank(a.difficulty) - difficultyRank(b.difficulty);
        if (difficultyDiff !== 0) return difficultyDiff;
        return b.score - a.score;
      });

      const top3 = sorted.slice(0, 3).map((recipe, index) => ({ ...recipe, rank: index + 1 }));
      setRecipes(top3);
      setActiveIndex(0);

      const ids = new Set<number>(favorites);
      top3.forEach((recipe) => recipe.favorite && ids.add(recipe.recipeId));
      setFavoriteIds(ids);
    } catch {
      setRecipes([]);
      setErrorMessage("Không tải được gợi ý món ăn. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const total = recipes.length;
  const activeRecipe = recipes[activeIndex];

  const goTo = useCallback(
    (direction: -1 | 1) => {
      if (total === 0) return;
      setActiveIndex((current) => (current + direction + total) % total);
    },
    [total]
  );

  const sideLeft = total > 1 ? recipes[(activeIndex - 1 + total) % total] : null;
  const sideRight = total > 2 ? recipes[(activeIndex + 1) % total] : null;

  const messages = useMemo(() => (activeRecipe ? buildAssistantMessages(activeRecipe) : []), [activeRecipe]);

  const handleToggleFavorite = useCallback(
    async (recipe: RecipeFromApi) => {
      const id = recipe.recipeId;
      if (pendingFavoriteIds.has(id)) return;
      const wasFavorite = favoriteIds.has(id);

      setPendingFavoriteIds((current) => new Set(current).add(id));
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (wasFavorite) next.delete(id);
        else next.add(id);
        return next;
      });

      try {
        if (wasFavorite) await removeFavoriteRecipe(id);
        else {
          await addFavoriteRecipe(id);
          setToast({ message: `Đã thêm "${recipe.name}" vào món yêu thích.`, variant: "success" });
        }
      } catch {
        setFavoriteIds((current) => {
          const next = new Set(current);
          if (wasFavorite) next.add(id);
          else next.delete(id);
          return next;
        });
        setToast({ message: "Không cập nhật được món yêu thích.", variant: "info" });
      } finally {
        setPendingFavoriteIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    },
    [favoriteIds, pendingFavoriteIds]
  );

  const handleAddMissingToShopping = useCallback((recipe: RecipeFromApi, missing: RecipeIngredientFromApi[]) => {
    if (missing.length === 0) {
      setToast({ message: "Món này đã đủ nguyên liệu, không cần thêm.", variant: "info" });
      return;
    }
    addPendingShoppingItems(
      missing.map((item) => ({
        foodId: item.foodId,
        foodName: item.foodName,
        unit: item.requiredUnit || "kg",
        quantity: item.requiredQuantity ?? 1,
        source: "RECIPE_MISSING" as const,
        note: `Thiếu cho ${recipe.name}`,
      }))
    );
    setToast({ message: `Đã thêm ${missing.length} nguyên liệu vào Kế hoạch đi chợ.`, variant: "success" });
    setSelectedRecipe(null);
  }, []);

  const renderSideCard = (recipe: RankedRecipe | null, position: "left" | "right") => {
    if (!recipe) return <div className={`ka-side-card ka-side-${position} ka-side-empty`} aria-hidden="true" />;
    const targetIndex = recipes.findIndex((item) => item.recipeId === recipe.recipeId);
    return (
      <button
        type="button"
        className={`ka-side-card ka-side-${position}`}
        onClick={() => setActiveIndex(targetIndex)}
        title={recipe.name}
      >
        <span className="ka-rank-badge ka-rank-small">#{recipe.rank}</span>
        <FilmPhoto recipe={recipe} size="sm" />
        <strong className="ka-side-name">{recipe.name}</strong>
        <span className={`ka-coverage-pill ${coverageTone(recipe.coveragePercent)}`}>
          Khớp {recipe.coveragePercent}%
        </span>
      </button>
    );
  };

  return (
    <div className="kitchen-assistant">
      <header className="ka-header">
        <button type="button" className="ka-back-btn" onClick={onBackToFridge} aria-label="Quay lại tủ lạnh">
          <span />
        </button>
        <div className="ka-header-text">
          <h1>
            <Sparkles size={18} /> Trợ lý nhà bếp
          </h1>
          <p>Top 3 món hợp nhất với tủ lạnh nhà bạn ngay lúc này.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="ka-state">
          <Loader2 className="ka-spin" size={26} />
          <span>Trợ lý đang ngó vào tủ lạnh của bạn...</span>
        </div>
      ) : errorMessage ? (
        <div className="ka-state error">
          <span>{errorMessage}</span>
          <button type="button" className="ka-ghost-btn" onClick={loadData}>
            Thử lại
          </button>
        </div>
      ) : total === 0 ? (
        <div className="ka-state">
          <ChefFridgeMascot />
          <span>Chưa tìm được món phù hợp với nguyên liệu hiện có.</span>
          <button type="button" className="ka-viewall-btn" onClick={onViewAll}>
            Xem tất cả công thức
          </button>
        </div>
      ) : (
        <div className="ka-body">
          {/* PHẦN LỚN: bộ thẻ công thức */}
          <section className="ka-carousel" aria-label="Công thức gợi ý">
            <button
              type="button"
              className="ka-nav-btn ka-nav-prev"
              onClick={() => goTo(-1)}
              disabled={total < 2}
              aria-label="Món trước"
            >
              <ChevronLeft size={22} />
            </button>

            {renderSideCard(sideLeft, "left")}

            {activeRecipe && (
              <article className="ka-main-card" key={activeRecipe.recipeId}>
                <span className="ka-pin" aria-hidden="true" />
                <span className="ka-rank-badge">
                  {activeRecipe.rank === 1 ? "★ Phù hợp nhất" : `#${activeRecipe.rank} Gợi ý`}
                </span>

                <FilmPhoto recipe={activeRecipe} size="lg" />

                <div className="ka-main-info">
                  <h2>{activeRecipe.name}</h2>
                  <div className="ka-tags">
                    <span className="ka-tag meal">{mealTimeLabel(activeRecipe.preferredMealTime)}</span>
                    <span className={`ka-tag diff ${difficultyClass(activeRecipe.difficulty)}`}>
                      {difficultyLabel(activeRecipe.difficulty)}
                    </span>
                    <span className={`ka-coverage-pill ${coverageTone(activeRecipe.coveragePercent)}`}>
                      Khớp {activeRecipe.coveragePercent}%
                    </span>
                  </div>

                  <div className="ka-meta-row">
                    <span>
                      <Clock size={14} /> {activeRecipe.cookingTimeMinutes ? `${activeRecipe.cookingTimeMinutes}'` : "—"}
                    </span>
                    <span>
                      <Users size={14} /> {activeRecipe.servings ? `${activeRecipe.servings} người` : "—"}
                    </span>
                    <span>
                      <Utensils size={14} /> {activeRecipe.ingredientCount} nguyên liệu
                    </span>
                  </div>

                  <button type="button" className="ka-detail-btn" onClick={() => setSelectedRecipe(activeRecipe)}>
                    Xem chi tiết công thức
                  </button>
                </div>
              </article>
            )}

            {renderSideCard(sideRight, "right")}

            <button
              type="button"
              className="ka-nav-btn ka-nav-next"
              onClick={() => goTo(1)}
              disabled={total < 2}
              aria-label="Món tiếp theo"
            >
              <ChevronRight size={22} />
            </button>

            <div className="ka-dots">
              {recipes.map((recipe, index) => (
                <button
                  key={recipe.recipeId}
                  type="button"
                  className={`ka-dot ${index === activeIndex ? "active" : ""}`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Món thứ ${index + 1}`}
                />
              ))}
            </div>
          </section>

          {/* PHẦN NHỎ: widget Trợ lý nhà bếp */}
          <aside className="ka-widget" aria-label="Trợ lý nhà bếp">
            <div className="ka-widget-main">
              <ChefFridgeMascot />

              <div className="ka-widget-content">
                <div className="ka-widget-title">
                  <strong>Trợ lý nhà bếp Fiza</strong>
                  <span>Trợ lý thông minh giúp bạn chọn món ăn phù hợp</span>
                </div>

                {activeRecipe && (
                  <div className="ka-chat-box">
                    {messages.map((line, index) => (
                      <div className="ka-chat-line" key={index}>
                        <span className="ka-chat-line-icon">{line.icon}</span>
                        <span>{line.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {activeRecipe && (
              <div className="ka-stats" aria-label="Chỉ số lý do gợi ý">
                <div className="ka-stat">
                  <strong>{activeRecipe.coveragePercent}%</strong>
                  <span>Khớp tủ lạnh</span>
                </div>
                <div className={`ka-stat ${activeRecipe.expiringIngredients.length > 0 ? "warn" : ""}`}>
                  <strong>{activeRecipe.expiringIngredients.length}</strong>
                  <span>Sắp hết hạn</span>
                </div>
                <div className={`ka-stat ${activeRecipe.missingIngredients.length > 0 ? "danger" : ""}`}>
                  <strong>{activeRecipe.missingIngredients.length}</strong>
                  <span>Cần mua thêm</span>
                </div>
                <div className="ka-stat">
                  <strong>{activeRecipe.cookingTimeMinutes ? `${activeRecipe.cookingTimeMinutes}'` : "—"}</strong>
                  <span>Thời gian nấu</span>
                </div>
              </div>
            )}

            <button type="button" className="ka-viewall-cta" onClick={onViewAll}>
              <span className="ka-viewall-emoji">🤔</span>
              <span className="ka-viewall-text">
                <strong>Chưa ưng 3 món này?</strong>
                <small>Xem tất cả gợi ý món ăn</small>
              </span>
              <ChevronRight size={18} />
            </button>
          </aside>
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailPopup
          recipe={selectedRecipe}
          isFavorite={favoriteIds.has(selectedRecipe.recipeId)}
          isFavoritePending={pendingFavoriteIds.has(selectedRecipe.recipeId)}
          onClose={() => setSelectedRecipe(null)}
          onToggleFavorite={handleToggleFavorite}
          onAddMissingToShopping={handleAddMissingToShopping}
        />
      )}

      {toast && (
        <div className={`ka-toast ${toast.variant}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default KitchenAssistantScreen;
