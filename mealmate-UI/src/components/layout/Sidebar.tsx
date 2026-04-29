import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <aside>
      {/* TODO: Sidebar với các menu items:
        - Nhóm gia đình
        - Kế hoạch đi chợ
        - Tủ lạnh
        - Gợi ý
        - Báo cáo
        Logo "Fiza" ở trên cùng (cách đọc trại của "Fridge")
        Highlight menu item đang active
      */}
      <h2>Fiza</h2>
      <nav>
        <ul>
          <li>Nhóm gia đình</li>
          <li>Kế hoạch đi chợ</li>
          <li>Tủ lạnh</li>
          <li>Gợi ý</li>
          <li>Báo cáo</li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
