import type { WeeklyShoppingAggregate } from '@/features/shopping-plan/shopping';
import { getWeeklyAggregate, toggleWeeklyItemStatus } from '@/features/shopping-plan/shoppingApi';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import CategoryCard from './CategoryCard';
import './WeeklyAggregateView.css';
import WeeklyItemRow from './WeeklyItemRow';

interface WeeklyAggregateViewProps {
    familyId: number | null;
    startDate: string;
    onToggleSuccess?: () => void;
}

const getCategoryInfo = (categoryName?: string) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('rau')) {
        return { icon: '🥦', color: '#B2EBD9' };
    }
    if (name.includes('thịt') || name.includes('thit')) {
        return { icon: '🥩', color: '#FFD6D6' };
    }
    if (name.includes('hải sản') || name.includes('hai san') || name.includes('cá') || name.includes('ca')) {
        return { icon: '🐟', color: '#D7ECFF' };
    }
    if (name.includes('sữa') || name.includes('sua') || name.includes('trứng') || name.includes('trung') || name.includes('dairy')) {
        return { icon: '🥛', color: '#F3E8FF' };
    }
    if (name.includes('trái cây') || name.includes('trai cay') || name.includes('quả') || name.includes('qua') || name.includes('fruit')) {
        return { icon: '🍎', color: '#FFE1A8' };
    }
    if (name.includes('gia vị') || name.includes('gia vi') || name.includes('spice')) {
        return { icon: '🧂', color: '#ECEFF1' };
    }
    if (name.includes('khô') || name.includes('kho') || name.includes('dry')) {
        return { icon: '🍞', color: '#F5E6D3' };
    }
    if (name.includes('uống') || name.includes('uong') || name.includes('drink') || name.includes('nước') || name.includes('nuoc')) {
        return { icon: '🥤', color: '#E0F7FA' };
    }
    return { icon: '📦', color: '#F1F5F9' };
};

const WeeklyAggregateView: React.FC<WeeklyAggregateViewProps> = ({ familyId, startDate, onToggleSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<WeeklyShoppingAggregate[]>([]);

    const fetchWeeklyAggregate = async () => {
        if (!familyId) return;
        try {
            setLoading(true);
            const data = await getWeeklyAggregate(familyId, startDate);
            setItems(data);
        } catch (error: any) {
            console.error('Error fetching weekly aggregate:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeeklyAggregate();
    }, [familyId, startDate]);

    const handleToggle = async (item: WeeklyShoppingAggregate) => {
        if (!familyId) return;
        const newStatus = !item.isPurchased;

        setItems(prev => prev.map(i => (i.foodId === item.foodId && i.foodName === item.foodName) ? { ...i, isPurchased: newStatus } : i));

        try {
            await toggleWeeklyItemStatus(familyId, item.foodId, startDate, newStatus, item.customName);
            toast.success(`Đã cập nhật trạng thái ${item.foodName} ✨`);
            if (onToggleSuccess) {
                onToggleSuccess();
            }
        } catch (error: any) {
            toast.error('Lỗi khi cập nhật trạng thái: ' + error.message);
            setItems(prev => prev.map(i => (i.foodId === item.foodId && i.foodName === item.foodName) ? { ...i, isPurchased: !newStatus } : i));
        }
    };

    if (loading) {
        return (
            <div className="weekly-loading">
                Đang tải dữ liệu gộp tuần...
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="weekly-empty-state">
                <span className="empty-icon">🛒</span>
                <span className="empty-text">Không có thực phẩm nào trong tuần này</span>
            </div>
        );
    }

    // Group items by categoryName
    const grouped = items.reduce((acc: Record<string, WeeklyShoppingAggregate[]>, item) => {
        const cat = item.categoryName || 'Khác';
        if (!acc[cat]) {
            acc[cat] = [];
        }
        acc[cat].push(item);
        return acc;
    }, {});

    return (
        <div className="weekly-aggregate-layout">
            {Object.entries(grouped).map(([category, catItems]) => (
                <CategoryCard
                    key={category}
                    title={category}
                    icon={getCategoryInfo(category).icon}
                    iconBgColor={getCategoryInfo(category).color}
                    itemCount={catItems.length}
                >
                    {catItems.map(item => (
                        <WeeklyItemRow
                            key={item.foodId + '_' + item.foodName}
                            name={item.foodName}
                            quantity={item.totalQuantity}
                            unit={item.unit}
                            usageDays={item.neededDays}
                            isPurchased={item.isPurchased}
                            onToggle={() => handleToggle(item)}
                        />
                    ))}
                </CategoryCard>
            ))}
        </div>
    );
};

export default WeeklyAggregateView;
