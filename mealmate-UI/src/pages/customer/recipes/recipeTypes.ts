// Kiểu dữ liệu dùng chung cho tính năng Gợi ý món ăn & Thư viện công thức.

export type RecipeIngredientFromApi = {
  foodId: number;
  foodName: string;
  requiredQuantity?: number;
  requiredUnit?: string;
  availableQuantity?: number;
  availableUnit?: string;
  sufficientQuantity: boolean;
  expiringSoon: boolean;
  nearestExpiryDate?: string;
};

export type RecipeFromApi = {
  recipeId: number;
  name: string;
  imageUrl?: string;
  description?: string;
  instructions?: string;
  cookingTimeMinutes?: number;
  servings?: number;
  calories?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | string;
  preferredMealTime?: "BREAKFAST" | "LUNCH" | "DINNER" | string;
  ingredientCount: number;
  score: number;
  coveragePercent: number;
  canCook: boolean;
  favorite?: boolean;
  matchedIngredients: RecipeIngredientFromApi[];
  missingIngredients: RecipeIngredientFromApi[];
  expiringIngredients: RecipeIngredientFromApi[];
};

export const mealTimeLabel = (value?: string) => {
  if (value === "BREAKFAST") return "Bữa sáng";
  if (value === "LUNCH") return "Bữa trưa";
  if (value === "DINNER") return "Bữa tối";
  return "Linh hoạt";
};

export const difficultyLabel = (value?: string) => {
  if (value === "EASY") return "Dễ";
  if (value === "MEDIUM") return "Trung bình";
  if (value === "HARD") return "Khó";
  return "Chưa rõ";
};

export const difficultyClass = (value?: string) => {
  if (value === "EASY") return "easy";
  if (value === "MEDIUM") return "medium";
  if (value === "HARD") return "hard";
  return "unknown";
};

export const coverageTone = (percent: number) => {
  if (percent > 90) return "high";
  if (percent >= 50) return "medium";
  return "low";
};

export const formatQuantity = (quantity?: number, unit?: string) => {
  if (quantity === undefined || quantity === null) return "—";
  const formatted = Number.isInteger(quantity) ? String(quantity) : String(Number(quantity.toFixed(2)));
  return `${formatted}${unit ? ` ${unit}` : ""}`;
};

// Tách phần hướng dẫn thành các bước rời rạc để hiển thị dạng danh sách.
export const splitInstructions = (instructions?: string): string[] => {
  if (!instructions) return [];
  const byLine = instructions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (byLine.length > 1) return byLine;

  return instructions
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
};

// Emoji minh hoạ theo nhóm nguyên liệu chính khi không có ảnh.
const recipeEmojiByKeyword: Array<[RegExp, string]> = [
  [/phở|bún|miến|mì|bánh phở/i, "🍜"],
  [/cơm|xôi/i, "🍚"],
  [/cháo/i, "🥣"],
  [/canh|súp/i, "🍲"],
  [/cá|basa|thu|mực|tôm|hải sản/i, "🐟"],
  [/gà/i, "🍗"],
  [/bò/i, "🥩"],
  [/heo|sườn|thịt|ba chỉ/i, "🍖"],
  [/rau|muống|cải/i, "🥬"],
  [/trứng/i, "🥚"],
  [/sinh tố|sữa chua|salad|trái cây/i, "🥗"],
];

export const recipeEmoji = (name: string) => {
  for (const [pattern, emoji] of recipeEmojiByKeyword) {
    if (pattern.test(name)) return emoji;
  }
  return "🍽️";
};
