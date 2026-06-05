import React from "react";
import RecipeBrowser from "./RecipeBrowser";

type MenuSuggestionScreenProps = {
  onCancel: () => void;
};

// Màn hình Gợi ý món ăn hiển thị nội tuyến trong trang Tủ lạnh (giống màn Thêm thực phẩm).
const MenuSuggestionScreen: React.FC<MenuSuggestionScreenProps> = ({ onCancel }) => {
  return <RecipeBrowser variant="suggestion" onBack={onCancel} />;
};

export default MenuSuggestionScreen;
