import type { ShoppingListItem } from '@/features/shopping-plan/shopping';
import { Check, X } from 'lucide-react';
import React from 'react';
import './ShoppingItemRow.css';
interface RowProps {
    item: ShoppingListItem;
    mode: 'CREATE' | 'DETAIL';
    onUpdate?: (id: number, fields: Partial<ShoppingListItem>) => void;
    onDelete?: (id: number) => void;
    onToggleStatus?: (id: number) => void;
}

const ShoppingItemRow: React.FC<RowProps> = ({ item, mode, onUpdate, onDelete, onToggleStatus }) => {

    if (mode === 'CREATE') {
        return (
            <div className="shopping-row-edit">
                <span className="food-name">{item.foodName || 'Thực phẩm'}</span>

                <div className="input-group">
                    <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdate?.(item.id, { quantity: Number(e.target.value) })}
                    />
                    <span className="unit-label">{item.unit}</span>
                </div>

                <div className="assignee-select">
                    {/* Hiển thị avatar và tên người phụ trách */}
                    <span>{item.assignee?.name || 'Chưa giao'}</span>
                </div>

                <button className="delete-row-btn" onClick={() => onDelete?.(item.id)}>
                    <X size={16} />
                </button>
            </div>
        );
    }

    // --- GIAO DIỆN LÚC XEM CHI TIẾT (CÓ CHECKBOX) ---
    return (
        <div className={`shopping-row-view ${item.isPurchased ? 'completed' : ''}`}>
            <div
                className={`checkbox ${item.isPurchased ? 'checked' : ''}`}
                onClick={() => onToggleStatus?.(item.id)}
            >
                {item.isPurchased && <Check size={14} color="white" />}
            </div>

            <span className="food-name-display">{item.foodName}</span>

            <div className="quantity-display">
                {item.quantity} {item.unit}
            </div>

            <div className="assignee-badge">
                {item.assignee?.name}
            </div>
        </div>
    );
};
export default ShoppingItemRow;