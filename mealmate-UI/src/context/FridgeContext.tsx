import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// TODO: Định nghĩa interface FridgeItem dựa trên FridgeItem entity từ backend
interface FridgeItem {
  id: number;
  foodName: string;
  quantity: number;
  unit: string;
  storageLocation: string;
  expiryDate: string;
  imageUrl?: string;
}

interface FridgeContextType {
  items: FridgeItem[];
  setItems: (items: FridgeItem[]) => void;
  addItem: (item: FridgeItem) => void;
  removeItem: (id: number) => void;
}

const FridgeContext = createContext<FridgeContextType | undefined>(undefined);

export const FridgeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<FridgeItem[]>([]);

  // TODO: Quản lý state tủ lạnh toàn cục:
  // - Fetch danh sách thực phẩm từ API khi component mount
  // - Cập nhật real-time khi thêm/xóa/sửa
  // - Tính toán cảnh báo hết hạn
  // - Sync với backend

  const addItem = (item: FridgeItem) => {
    setItems((prev) => [...prev, item]);
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <FridgeContext.Provider value={{ items, setItems, addItem, removeItem }}>
      {children}
    </FridgeContext.Provider>
  );
};

export const useFridge = (): FridgeContextType => {
  const context = useContext(FridgeContext);
  if (!context) {
    throw new Error('useFridge phải được sử dụng trong FridgeProvider');
  }
  return context;
};

export default FridgeContext;
