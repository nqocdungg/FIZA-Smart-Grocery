import type { ShoppingListItem } from '@/features/shopping-plan/shopping';
import { Check, ChevronDown, X } from 'lucide-react';
import React from 'react';
import './ShoppingItemRow.css';
interface RowProps {
    item: ShoppingListItem;
    mode: 'CREATE' | 'DETAIL';
    members?: any[];
    onUpdate?: (id: number, fields: Partial<ShoppingListItem>) => void;
    onDelete?: (id: number) => void;
    onToggleStatus?: (id: number) => void;
}

const ShoppingItemRow: React.FC<RowProps> = ({ item, mode, members = [], onUpdate, onDelete, onToggleStatus }) => {

    if (mode === 'CREATE') {
        const selectedMember = members.find(m => m.id === item.assignedTo);
        const displayName = selectedMember ? selectedMember.name : (item.assigneeName || 'Chưa giao');
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

                <div className="assignee-select-wrapper">
                    <span className="assignee-display-text">{displayName}</span>
                    <ChevronDown size={14} className="assignee-chevron" />
                    <select
                        className="assignee-dropdown-hidden"
                        value={item.assignedTo || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            onUpdate?.(item.id, {
                                assignedTo: val === '' ? undefined : Number(val)
                            });
                        }}
                    >
                        <option value="">Chưa giao</option>
                        {members.map((m: any) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
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
                {item.assigneeName || 'Chưa giao'}
            </div>
        </div>
    );
};
export default ShoppingItemRow;