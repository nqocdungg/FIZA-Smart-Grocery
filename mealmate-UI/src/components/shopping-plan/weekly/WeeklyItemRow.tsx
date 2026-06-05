import { Check } from 'lucide-react';
import React from 'react';
import './WeeklyItemRow.css';

interface WeeklyItemRowProps {
    name: string;
    quantity: number;
    unit: string;
    usageDays: string[]; // ["T2", "T5"]
    isPurchased: boolean;
    onToggle: () => void;
}

const WeeklyItemRow: React.FC<WeeklyItemRowProps> = ({ name, quantity, unit, usageDays, isPurchased, onToggle }) => {
    return (
        <div className={`weekly-item-row ${isPurchased ? 'completed' : ''}`}>
            <div className={`checkbox-circle ${isPurchased ? 'checked' : ''}`} onClick={onToggle}>
                {isPurchased && <Check size={14} color="white" />}
            </div>

            <div className="item-info">
                <span className="item-name">{name}</span>
                <span className="item-usage">Cần cho: {usageDays.join(', ')}</span>
            </div>

            <div className="item-badge">
                {quantity} {unit}
            </div>
        </div>
    );
};

export default WeeklyItemRow;