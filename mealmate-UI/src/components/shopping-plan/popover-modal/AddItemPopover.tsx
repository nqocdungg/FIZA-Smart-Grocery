import { Check, ChevronDown, Minus, Plus } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import './AddItemPopover.css';

interface AddItemPopoverProps {
    foodName: string;
    foodIcon?: string;
    unit: string;
    onConfirm: (data: { quantity: number; assignedTo: number | null; note: string; customName?: string; unit?: string }) => void;
    onCancel: () => void;
    members?: any[];
    commonUnits?: string[];
}

const AddItemPopover: React.FC<AddItemPopoverProps> = ({
    foodName,
    foodIcon = "🍎",
    unit,
    members = [],
    onConfirm,
    onCancel,
    commonUnits = []
}) => {
    const [quantity, setQuantity] = useState(1);
    const [assigneeId, setAssigneeId] = useState<number | ''>('');
    const [note, setNote] = useState('');
    const [customName, setCustomName] = useState('');
    const parsedUnits = unit.split(',').map(u => u.trim().toLowerCase()).filter(Boolean);
    const defaultUnit = parsedUnits[0] || 'kg';
    const [selectedUnit, setSelectedUnit] = useState(defaultUnit);

    const isOther = foodName.toLowerCase().includes("khác");

    const getAssigneeName = () => {
        if (assigneeId === '') return 'Chọn người phụ trách';
        const found = members.find(m => m.id === assigneeId);
        return found ? found.fullName : 'Chọn người phụ trách';
    };

    const handleConfirm = () => {
        if (isOther && !customName.trim()) {
            toast.error("Vui lòng nhập tên thực phẩm cụ thể!");
            return;
        }
        onConfirm({
            quantity,
            assignedTo: assigneeId === '' ? null : assigneeId,
            note,
            customName: isOther ? customName.trim() : undefined,
            unit: selectedUnit
        });
    };

    React.useEffect(() => {
        const parsed = unit.split(',').map(u => u.trim().toLowerCase()).filter(Boolean);
        setSelectedUnit(parsed[0] || 'kg');
    }, [unit]);

    const finalCommonUnits = commonUnits.includes(defaultUnit) ? commonUnits : [defaultUnit, ...commonUnits];

    return (
        <div className="add-item-popover">
            {/*Tên thực phẩm */}
            <div className="popover-food-header">
                <span className="popover-food-icon">{foodIcon}</span>
                <span className="popover-food-name">{foodName}</span>
            </div>

            {isOther && (
                <div className="popover-row-vertical">
                    <label className="required-label">TÊN THỰC PHẨM CỤ THỂ</label>
                    <input
                        className="custom-name-input"
                        placeholder="Ví dụ: Rau cải cúc, Thịt bò Mỹ..."
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                    />
                </div>
            )}

            <div className="popover-divider"></div>

            {/* Assignee Section */}
            <div className="popover-row">
                <label>GIAO CHO</label>
                <div className="custom-select">
                    <span>{getAssigneeName()}</span>
                    <ChevronDown size={16} />
                    <select
                        className="custom-select-native"
                        value={assigneeId}
                        onChange={(e) => {
                            const val = e.target.value;
                            setAssigneeId(val === '' ? '' : Number(val));
                        }}
                    >
                        <option value="">Chọn người phụ trách</option>
                        {members.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                    </select>
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
                    {isOther ? (
                        <select
                            className="popover-unit-select"
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                        >
                            {finalCommonUnits.map(u => (
                                <option key={u} value={u}>{u.toUpperCase()}</option>
                            ))}
                        </select>
                    ) : parsedUnits.length > 1 ? (
                        <select
                            className="popover-unit-select"
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                        >
                            {parsedUnits.map(u => (
                                <option key={u} value={u}>{u.toUpperCase()}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="unit-text">{selectedUnit.toUpperCase()}</span>
                    )}
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
                <button className="popover-btn-confirm" onClick={handleConfirm}>
                    <Check size={18} /> Xác nhận
                </button>
            </div>

            {/* Mũi tên trỏ của Popover */}
            <div className="popover-arrow"></div>
        </div>
    );
};

export default AddItemPopover;
