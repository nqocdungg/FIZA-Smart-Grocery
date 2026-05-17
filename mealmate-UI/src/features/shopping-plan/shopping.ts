export const STORAGE_LOCATION = {
  COOL: "COOL",
  FREEZER: "FREEZER",
  DRY: "DRY",
} as const;
export type StorageLocation = keyof typeof STORAGE_LOCATION;

export const FRIDGE_ITEM_STATUS = {
  STORED: "STORED",
  EXPIRED: "EXPIRED",
  USED: "USED",
  REMOVED: "REMOVED",
} as const;
export type FridgeItemStatus = keyof typeof FRIDGE_ITEM_STATUS;

export interface UserSummary {
  id: number;
  name: string;
  avatar?: string;
}

// Chi tiết thực phẩm
export interface Food {
  id: number;
  name: string;
  category?: string;
  image_url?: string;
}

// Bảng shopping_list_items
export interface ShoppingListItem {
  id: number;
  shopping_list_id: number;
  food_id: number;
  food?: Food;
  quantity: number;
  unit: string;
  note?: string;
  assigned_to?: number; // ID users
  assignee?: UserSummary;
  is_purchased: boolean;
  order_number?: number;
}

// Bảng shopping_lists
export interface ShoppingList {
  id: number;
  created_by: number;
  family_id: number;
  created_date: string;
  planned_date: string;
  note?: string;
  items: ShoppingListItem[];
}

// Bảng fridge_items (Dùng để gợi ý mua sắm hoặc kiểm tra tồn kho)
export interface FridgeItem {
  id: number;
  food_id: number;
  food?: Food;
  quantity: number;
  storage_location: StorageLocation;
  expiry_date?: string;
  status: FridgeItemStatus;
}

// 1. Cho các ô "Thứ x - Ngày y" trong Grid
export interface DailyPlanCardData {
  planned_date: string; // Dùng để filter
  dayOfWeek: string; // "Thứ 2", "Thứ 3"...
  displayDate: string; // "4/5"
  totalItems: number; // Count items
  purchasedItems: number; // Count items where is_purchased = true
  assigneeNames: string[]; // Danh sách tên những người được giao (assigned_to)
  listId?: number;
}

// 2. Cho phần "Thực phẩm thường mua" (FrequentItems)
// Logic: Có thể lấy từ các món trong tủ lạnh đang sắp hết hoặc mua nhiều lần trong lịch sử
export interface FrequentItemSuggestion {
  food_id: number;
  name: string;
  unit: string;
  standard_quantity: number; // Số lượng gợi ý thường mua
  image_url?: string;
}

// 3. Cho phần "Tiến độ mua sắm" (ProgressSection)
export interface ShoppingProgressStats {
  percentage: number; // 45
  completedCategories: number;
  totalCategories: number;
  message: string; // "Còn 6 danh mục cần hoàn thành..."
}
