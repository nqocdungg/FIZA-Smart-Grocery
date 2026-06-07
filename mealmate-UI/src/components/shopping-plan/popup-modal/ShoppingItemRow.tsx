import type { ShoppingListItem } from '@/features/shopping-plan/shopping';
import { updateItemNote } from '@/features/shopping-plan/shoppingApi';
import { Check, ChevronDown, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import './ShoppingItemRow.css';

interface RowProps {
    item: ShoppingListItem;
    mode: 'CREATE' | 'DETAIL';
    members?: any[];
    onUpdate?: (id: number, fields: Partial<ShoppingListItem>) => void;
    onDelete?: (id: number) => void;
    onToggleStatus?: (id: number) => void;
    isFadingOut?: boolean;
}

const ShoppingItemRow: React.FC<RowProps> = ({ item, mode, members = [], onUpdate, onDelete, onToggleStatus, isFadingOut }) => {
    const [localNote, setLocalNote] = useState(item.note || '');
    const [assigneeId, setAssigneeId] = useState<number | ''>('');
    const getAssigneeName = () => {
        if (assigneeId === '') return 'Chọn người phụ trách';
        const found = members.find(m => m.id === assigneeId);
        return found ? found.fullName : 'Chọn người phụ trách';
    };

    useEffect(() => {
        setLocalNote(item.note || '');
    }, [item.note]);

    const handleDetailNoteBlur = async () => {
        if (localNote !== (item.note || '')) {
            try {
                await updateItemNote(item.id, localNote);
                toast.success(`Đã lưu ghi chú cho ${item.foodName || 'thực phẩm'}`);
                onUpdate?.(item.id, { note: localNote });
            } catch (error: any) {
                toast.error("Lưu ghi chú thất bại: " + error.message);
                // Revert to old note value if API fails
                setLocalNote(item.note || '');
            }
        }
    };

    if (mode === 'CREATE') {
        const selectedMember = members.find(m => m.id === item.assignedTo);
        const displayName = selectedMember ? selectedMember.fullName : (item.assigneeName || 'Chưa giao');
        return (
            <div className="shopping-row-edit">
                <div className="food-info-edit">
                    <span className="food-name">{item.foodName || 'Thực phẩm'}</span>
                    <input
                        className="item-note-input"
                        type="text"
                        value={item.note || ''}
                        placeholder="Thêm lưu ý..."
                        onChange={(e) => onUpdate?.(item.id, { note: e.target.value })}
                    />
                </div>

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
                            const memberId = val === "" ? undefined : Number(val);
                            const member = members.find(m => m.id === memberId);
                            onUpdate?.(item.id, {
                                assignedTo: memberId,
                                assigneeName: member ? member.fullName : 'Chưa giao'
                            });

                        }}
                    >
                        <option value="">Chưa giao</option>
                        {members.map((m: any) => (
                            <option key={m.id} value={m.id}>
                                {m.fullName}
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

    // --- GIAO DIỆN XEM CHI TIẾT (CÓ CHECKBOX) ---
    const isImported = !!(item.importedToFridgeAt || item.imported_to_fridge_at);

    return (
        <div className={`shopping-row-view ${item.isPurchased ? 'completed' : ''} ${isFadingOut ? 'fading-out' : ''}`}>
            <div
                className={`checkbox ${item.isPurchased ? 'checked' : ''} ${isImported ? 'disabled' : ''}`}
                onClick={() => {
                    if (!isImported) {
                        onToggleStatus?.(item.id);
                    }
                }}
            >
                {item.isPurchased && <Check size={14} color="white" />}
            </div>

            <div className="food-info-display">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="food-name-display">{item.foodName}</span>
                    {isImported && <span className="imported-badge">Đã trong tủ</span>}
                </div>
                <input
                    className="item-note-input"
                    type="text"
                    value={localNote}
                    placeholder="Thêm lưu ý..."
                    onChange={(e) => setLocalNote(e.target.value)}
                    onBlur={handleDetailNoteBlur}
                    disabled={isImported}
                />
            </div>

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