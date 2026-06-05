import './CategoryGroup.css';
import ShoppingItemRow from "./ShoppingItemRow";
const CategoryGroup = ({ categoryName, items, mode, icon, onUpdate, onDelete, onToggleStatus }: any) => {
  return (
    <div className="category-card">
      <div className="category-header">
        <div className="category-title">
          <span className="category-icon">{icon || '🥕'}</span>
          <h4>{categoryName}</h4>
        </div>
        <span className="item-count">{items.length} MỤC</span>
      </div>

      <div className="items-list">
        {items.map((item: any) => (
          <ShoppingItemRow 
            key={item.id} 
            item={item} 
            mode={mode} 
            onUpdate={onUpdate}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </div>
    </div>
  );
};
export default CategoryGroup;