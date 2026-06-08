import './CategoryGroup.css';
import ShoppingItemRow from "./ShoppingItemRow";

const CategoryGroup = ({ categoryName, items, icon, categoryColor, mode, onUpdate, onDelete, onToggleStatus, members, filterStatus }: any) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="category-group-flat">
      <div className="category-header-flat"
        style={{ backgroundColor: categoryColor }}>
        <span className="category-icon-flat">{icon}</span>
        <span className="category-title-text" style={{ color: '#171D1A' }}>{categoryName}</span>
        <span className="category-item-count">{items.length} món</span>
      </div>

      <div className="category-items-list-flat">
        {items.map((item: any) => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            mode={mode}
            members={members}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            isFadingOut={item.isPurchased && filterStatus === 'PENDING'}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryGroup;