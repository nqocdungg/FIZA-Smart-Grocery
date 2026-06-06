import api from "@/services/api";
import type {
  DailyPlanCardData,
  Food,
  ShoppingListItem,
  UserSummary,
} from "./shopping";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ShoppingItemRequest {
  foodId: number;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  assignedTo?: number | null;
  note?: string;
}

export interface SaveShoppingPlanRequest {
  familyId: number;
  plannedDate: string; // YYYY-MM-DD
  note?: string;
  items: ShoppingItemRequest[];
}
export const getUserFamilies = async (): Promise<any[]> => {
  const response = await api.get("/api/v1/users/familys");
  if (!response.data.success) {
    throw new Error(
      response.data.message || "Không thể lấy thông tin gia đình.",
    );
  }
  return response.data.data;
};

/**
 * 1. Lấy tóm tắt 7 ngày trong tuần (cho Grid)
 */
export const getWeeklySummary = async (
  familyId: number,
  startDate: string,
): Promise<DailyPlanCardData[]> => {
  const response = await api.get<ApiResponse<DailyPlanCardData[]>>(
    "/api/v1/shopping/summary",
    {
      params: { familyId, startDate },
    },
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Không thể lấy dữ liệu tóm tắt.");
  }

  return response.data.data;
};

/**
 * 2. Lấy chi tiết món ăn của 1 ngày (cho Modal)
 */
export const getPlanDetail = async (
  familyId: number,
  date: string,
): Promise<ShoppingListItem[]> => {
  const response = await api.get<ApiResponse<ShoppingListItem[]>>(
    "/api/v1/shopping/detail",
    {
      params: { familyId, date },
    },
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Không thể lấy chi tiết kế hoạch.",
    );
  }

  return response.data.data;
};

/**
 * 3. Đánh dấu đã mua / chưa mua (cho Checkbox)
 */
export const toggleItemStatus = async (itemId: number): Promise<void> => {
  const response = await api.patch<ApiResponse<void>>(
    `/api/v1/shopping/items/${itemId}/toggle`,
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Cập nhật trạng thái thất bại.");
  }
};

/**
 * 4. Tìm kiếm thực phẩm (cho Popover thêm đồ)
 */
export const searchFoods = async (query: string): Promise<Food[]> => {
  const response = await api.get<ApiResponse<Food[]>>(
    "/api/v1/shopping/foods/search",
    {
      params: { query },
    },
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Tìm kiếm thất bại.");
  }

  return response.data.data;
};

/**
 * 5. Lưu kế hoạch (Tạo mới hoặc Cập nhật)
 */
export const saveShoppingPlan = async (
  payload: SaveShoppingPlanRequest,
): Promise<void> => {
  const response = await api.post<ApiResponse<void>>(
    "/api/v1/shopping/save",
    payload,
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Lưu kế hoạch thất bại.");
  }
};

export const deleteShoppingList = async (listId: number): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(
    `/api/v1/shopping/${listId}`,
  );
  if (!response.data.success) {
    throw new Error(response.data.message || "Xóa kế hoạch thất bại.");
  }
};

export const updateShoppingListNote = async (listId: number, note: string): Promise<void> => {
  const response = await api.patch<ApiResponse<void>>(
    `/api/v1/shopping/${listId}/note`,
    { note }
  );
  if (!response.data.success) {
    throw new Error(response.data.message || "Cập nhật ghi chú thất bại.");
  }
};

export const getFrequentItems = async (familyId: number): Promise<any[]> => {
  const response = await api.get<ApiResponse<any[]>>(
    "/api/v1/shopping/frequent",
    { params: { familyId } }
  );
  if (!response.data.success) {
    throw new Error(response.data.message || "Lấy danh sách thực phẩm thường mua thất bại.");
  }
  return response.data.data;
};

export const getFamilyMembers = async (): Promise<UserSummary[]> => {
  const response = await api.get(`/api/v1/users/users/family/members`);
  if (!response.data.success) {
    throw new Error(
      response.data.message || "Không thể lấy danh sách thành viên.",
    );
  }
  return response.data.data;
};
