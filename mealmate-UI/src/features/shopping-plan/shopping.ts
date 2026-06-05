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
  foodName: string;
  category?: string;
  imageUrl?: string;
}

// Bảng shopping_list_items
export interface ShoppingListItem {
  id: number;
  shoppingListId: number;
  foodId: number;
  custom_name?: string;
  food?: Food;
  foodName?: string;
  categoryName?: string;
  quantity: number;
  unit: string;
  note?: string;
  assignedTo?: number; // ID users
  assignee?: UserSummary;
  isPurchased: boolean;
  orderNumber?: number;
  imported_to_fridge_at?: string;
  fridge_item_id?: number;
  order_number?: number;
}

// Bảng shopping_lists
export interface ShoppingList {
  id: number;
  createdBy: number;
  familyId: number;
  createdDate: string;
  plannedDate: string;
  note?: string;
  items: ShoppingListItem[];
}

// Bảng fridge_items (Dùng để gợi ý mua sắm hoặc kiểm tra tồn kho)
export interface FridgeItem {
  id: number;
  foodId: number;
  food?: Food;
  quantity: number;
  storageLocation: StorageLocation;
  expiryDate?: string;
  status: FridgeItemStatus;
}

// 1. Cho các ô "Thứ x - Ngày y" trong Grid
export interface DailyPlanCardData {
  plannedDate: string; // YYYY-MM-DD
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
  foodId: number;
  foodName: string;
  unit: string;
  standardQuantity: number;
  imageUrl?: string;
}

// 3. Cho phần "Tiến độ mua sắm" (ProgressSection)
export interface ShoppingProgressStats {
  percentage: number; // 45
  completedCategories: number;
  totalCategories: number;
  message: string;
}
