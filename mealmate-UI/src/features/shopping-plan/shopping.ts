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
  roleName?: string;
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
  customName?: string;
  food?: Food;
  foodName?: string;
  categoryName?: string;
  quantity: number;
  unit: string;
  note?: string;
  assignedTo?: number; // ID users
  assigneeName?: string;
  assignee?: { id?: number; name?: string };
  isPurchased: boolean;
  orderNumber?: number;
  imported_to_fridge_at?: string;
  fridge_item_id?: number;
  importedToFridgeAt?: string;
  fridgeItemId?: number;
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

export interface DailyPlanCardData {
  plannedDate: string;
  dayOfWeek: string;
  displayDate: string;
  totalItems: number;
  purchasedItems: number;
  assigneeNames: string[];
  listId?: number;
  note?: string;
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

export interface WeeklyShoppingAggregate {
  foodId: number;
  foodName: string;
  categoryName: string;
  foodIcon: string;
  totalQuantity: number;
  unit: string;
  neededDays: string[];
  isPurchased: boolean;
  itemIds: number[];
}
