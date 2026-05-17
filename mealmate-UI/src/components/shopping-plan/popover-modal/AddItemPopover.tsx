import { Check, ChevronDown, Minus, Plus } from 'lucide-react';
import React, { useState } from 'react';
import './AddItemPopover.css';

interface AddItemPopoverProps {
    foodName: string;
    foodIcon?: string;
    unit: string;
    onConfirm: (data: { quantity: number; assignee: string; note: string }) => void;
    onCancel: () => void;
}

const AddItemPopover: React.FC<AddItemPopoverProps> = ({
    foodName,
    foodIcon = "🍎",
    unit,
    onConfirm,
    onCancel
}) => {
    const [quantity, setQuantity] = useState(1);
    const [assignee, setAssignee] = useState('Mẹ');
    const [note, setNote] = useState('');

    return (
        <div className="add-item-popover">
            {/*Tên thực phẩm */}
            <div className="popover-food-header">
                <span className="popover-food-icon">{foodIcon}</span>
                <span className="popover-food-name">{foodName}</span>
            </div>

            <div className="popover-divider"></div>

            {/* Assignee Section */}
            <div className="popover-row">
                <label>GIAO CHO</label>
                <div className="custom-select">
                    <span>{assignee}</span>
                    <ChevronDown size={16} />
                    {/* Ở đây có thể làm thêm dropdown menu nếu cần */}
                </div>
            </div>

            {/* Quantity Section */}
            <div className="popover-row-vertical">
                <label>SỐ LƯỢNG</label>
                <div className="quantity-controls">
                    <div className="quantity-input-box">
                        <button onClick={() => setQuantity(q => Math.max(0.5, q - 0.5))}><Minus size={14} /></button>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                        <button onClick={() => setQuantity(q => q + 0.5)}><Plus size={14} /></button>
                    </div>
                    <span className="unit-text">{unit.toUpperCase()}</span>
                </div>
            </div>

            {/* Note Section */}
            <div className="popover-row-vertical">
                <input
                    className="note-input"
                    placeholder="Ghi chú nhanh..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>

            {/* Actions */}
            <div className="popover-footer">
                <button className="popover-btn-cancel" onClick={onCancel}>Hủy</button>
                <button className="popover-btn-confirm" onClick={() => onConfirm({ quantity, assignee, note })}>
                    <Check size={18} /> Xác nhận
                </button>
            </div>

            {/* Mũi tên trỏ của Popover */}
            <div className="popover-arrow"></div>
        </div>
    );
};

export default AddItemPopover;