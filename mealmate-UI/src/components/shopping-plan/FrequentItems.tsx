import type { FrequentItemSuggestion } from '@/features/shopping-plan/shopping';
import React from 'react';
import './FrequentItems.css';


interface FrequentItemsProps {
    items?: FrequentItemSuggestion[];
    onAdd?: (item: FrequentItemSuggestion) => void;
}

const FrequentItems: React.FC<FrequentItemsProps> = ({ items, onAdd }) => {
    const displayItems: FrequentItemSuggestion[] = items || [
        { foodId: 1, foodName: 'Sữa tươi nguyên chất', unit: '2L', standardQuantity: 1 },
        { foodId: 2, foodName: 'Trứng gà ta', unit: '10 quả', standardQuantity: 1 },
    ];

    return (
        <div className="frequent-items-container">
            {/* Header */}
            <div className="frequent-header">
                <div className="frequent-icon-box">
                    <div className="frequent-icon-inner">🛒</div>
                </div>
                <h3 className="frequent-title">Thực phẩm thường mua</h3>
            </div>

            {/* List Items */}
            <div className="frequent-list">
                {displayItems.map((item) => (
                    <div key={item.foodId} className="frequent-row">
                        <div className="frequent-row-left">
                            <div className="frequent-item-check">
                                <div className="check-dot"></div>
                            </div>
                            <span className="frequent-item-name">{item.foodName}</span>
                        </div>

                        <div className="frequent-row-right">
                            <span className="frequent-item-unit">{item.unit}</span>
                            {/* Nút cộng để thêm nhanh vào danh sách đi chợ hiện tại */}
                            <button
                                className="frequent-add-btn"
                                onClick={() => onAdd?.(item)}
                                title="Thêm vào danh sách"
                            >
                                +
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FrequentItems;